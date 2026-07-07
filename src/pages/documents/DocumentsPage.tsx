import React, { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Download, Trash2, PenLine, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Document } from '../../types';
import { listDocuments, uploadDocument, deleteDocument, signDocument } from '../../api/documents';

const statusVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
  draft: 'secondary',
  pending_signature: 'warning',
  signed: 'success',
  final: 'success',
};

// A small canvas-based signature pad - draw with mouse/touch, export as PNG.
const SignaturePad: React.FC<{ onSave: (blob: Blob) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stop = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    canvasRef.current!.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Draw your signature</h3>
          <button onClick={onCancel}><X size={20} className="text-gray-500" /></button>
        </div>
        <canvas
          ref={canvasRef}
          width={440}
          height={180}
          className="border border-gray-300 rounded-md bg-gray-50 w-full touch-none"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={stop}
        />
        <div className="flex gap-3 mt-4">
          <Button onClick={save}>Save Signature</Button>
          <Button variant="outline" onClick={clear}>Clear</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [signingDocId, setSigningDocId] = useState<number | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState('');

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await listDocuments();
      setDocuments(data);
    } catch {
      toast.error('Could not load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocument(title || file.name, file);
      toast.success('Document uploaded!');
      setTitle('');
      loadDocuments();
    } catch {
      toast.error('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const handleDelete = async (id: number) => {
    try {
      await deleteDocument(id);
      toast.success('Document deleted.');
      loadDocuments();
    } catch {
      toast.error('Could not delete document (only the uploader can delete it).');
    }
  };

  const handleSaveSignature = async (blob: Blob) => {
    if (signingDocId === null) return;
    try {
      await signDocument(signingDocId, blob);
      toast.success('Document signed!');
      setSigningDocId(null);
      loadDocuments();
    } catch {
      toast.error('Could not save signature.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document Processing Chamber</h1>
        <p className="text-gray-600">Upload, preview, and e-sign your important files</p>
      </div>

      <Card>
        <CardBody>
          <Input
            label="Document title (optional — defaults to file name)"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4"
          />
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm text-gray-600">
              {uploading ? 'Uploading...' : isDragActive ? 'Drop the file here' : 'Drag & drop a file, or click to select'}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-gray-500 text-sm">No documents yet — upload one above.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="p-2 bg-primary-50 rounded-lg mr-4">
                    <FileText size={24} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{doc.title}</h3>
                      <Badge variant={statusVariant[doc.status] || 'secondary'} size="sm">
                        {doc.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>v{doc.version}</span>
                      <span>Uploaded by {doc.uploaded_by_name}</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" className="p-2" aria-label="Sign" onClick={() => setSigningDocId(doc.id)}>
                      <PenLine size={18} />
                    </Button>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="p-2" aria-label="Download">
                        <Download size={18} />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-error-600 hover:text-error-700"
                      aria-label="Delete"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Preview modal - browsers render PDFs/images natively in an iframe */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">{previewDoc.title}</h3>
              <button onClick={() => setPreviewDoc(null)}><X size={20} className="text-gray-500" /></button>
            </div>
            <iframe src={previewDoc.file_url} className="flex-1 w-full" title={previewDoc.title} />
            {previewDoc.signature_url && (
              <div className="p-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Signature:</p>
                <img src={previewDoc.signature_url} alt="Signature" className="h-16" />
              </div>
            )}
          </div>
        </div>
      )}

      {signingDocId !== null && (
        <SignaturePad onSave={handleSaveSignature} onCancel={() => setSigningDocId(null)} />
      )}
    </div>
  );
};
