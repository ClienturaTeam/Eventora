import { useState } from "react";
import { useMySubmissions, useUploadSubmissionFile, useFinalSubmitSubmission, useParticipantDashboard } from "../hooks/participant.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Upload, Lock, FileText, CheckCircle2, AlertCircle, AlertTriangle, Paperclip } from "lucide-react";
import { toast } from "sonner";

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf", "doc", "docx", "mp4", "mov", "avi"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function ParticipantSubmissionsPage() {
  const { data: dashboardData, isLoading: loadingDashboard } = useParticipantDashboard();
  const { data: submissions = [], isLoading: loadingSubmissions } = useMySubmissions();
  const uploadFileMutation = useUploadSubmissionFile();
  const finalSubmitMutation = useFinalSubmitSubmission();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);

  const activeSubmission = submissions[0] || (dashboardData?.submission?.submissionId ? { id: dashboardData.submission.submissionId, isLocked: dashboardData.submission.isLocked, status: dashboardData.submission.status, files: dashboardData.submission.files } : null);
  const isLocked = activeSubmission?.isLocked || dashboardData?.submission?.isLocked || false;
  const filesList = activeSubmission?.files || dashboardData?.submission?.files || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;

    // Check extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Invalid file format .${ext}. Allowed formats: PNG, JPG, JPEG, PDF, DOC, DOCX, MP4, MOV, AVI`);
      e.target.value = "";
      return;
    }

    // Check 20 MB limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 20 MB limit!`);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (isLocked) {
      toast.error("Submission is locked and cannot accept further uploads.");
      return;
    }

    try {
      setIsUploading(true);
      const fileData: { fileName: string; fileSize: number; fileType: string; fileUrl: string; description?: string } = {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || selectedFile.name.split(".").pop() || "document",
        fileUrl: `/uploads/${selectedFile.name}`
      };
      if (description.trim()) {
        fileData.description = description.trim();
      }

      await uploadFileMutation.mutateAsync({
        submissionId: activeSubmission?.id || "default-submission",
        fileData
      });
      toast.success(`Uploaded '${selectedFile.name}' successfully!`);
      setSelectedFile(null);
      setDescription("");
    } catch (err: any) {
      toast.error(err.message || "File upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      await finalSubmitMutation.mutateAsync(activeSubmission?.id || "default-submission");
      toast.success("Project submission locked and finalized!");
      setShowFinalSubmitModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize submission.");
    }
  };

  if (loadingDashboard || loadingSubmissions) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Project Submission</h1>
          </div>

          {isLocked ? (
            <Badge variant="default" className="bg-emerald-600 gap-1.5 px-3 py-1 text-xs">
              <Lock className="h-3.5 w-3.5" /> Submission Locked
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
              Draft / Editable
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Upload hackathon project documentation, source archives, or presentation videos (Max 20 MB per file).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Card */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" /> File Upload & Submission
            </CardTitle>
            <CardDescription className="text-xs">
              Allowed file formats: PNG, JPG, JPEG, PDF, DOC, DOCX, MP4, MOV, AVI. Maximum file size: 20 MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLocked ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-400 space-y-1">
                <p className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Submission Finalized & Locked
                </p>
                <p className="text-xs">
                  Your team project has been submitted. No further file uploads or edits are permitted.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="submissionFile">Select File to Upload</Label>
                  <Input
                    id="submissionFile"
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.mp4,.mov,.avi"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Supported: PNG, JPG, JPEG, PDF, DOC, DOCX, MP4, MOV, AVI (Max 20MB)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submissionDescription">Project / File Description</Label>
                  <Textarea
                    id="submissionDescription"
                    placeholder="Enter project description, repository links, architecture summary, or notes for judges..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUploading}
                    className="min-h-[90px] text-xs resize-y"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Provide relevant details, key features, or notes about your project submission.
                  </p>
                </div>

                {selectedFile && (
                  <div className="p-3 border rounded-md bg-muted/30 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold">{selectedFile.name}</p>
                      <p className="text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      {description && (
                        <p className="text-[11px] text-primary italic mt-1 truncate max-w-sm">
                          "{description}"
                        </p>
                      )}
                    </div>
                    <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                      {isUploading ? "Uploading..." : "Upload File"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Uploaded Files Roster */}
            <div className="space-y-2 pt-4 border-t">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Uploaded Files ({filesList.length})
              </h4>

              {filesList.length > 0 ? (
                <div className="divide-y border rounded-md">
                  {filesList.map((file: any, idx: number) => (
                    <div key={file.id || idx} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="font-medium text-foreground">{file.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {file.fileType}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Uploaded
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">No files uploaded yet.</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="bg-muted/20 border-t flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Status: <span className="font-semibold text-foreground">{isLocked ? "SUBMITTED" : "DRAFT"}</span>
            </span>

            {!isLocked && (
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={() => setShowFinalSubmitModal(true)}
              >
                <Lock className="h-3.5 w-3.5" /> Final Submit & Lock
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Guidelines Card */}
        <Card className="shadow-sm border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Submission Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <p>1. Ensure your problem statement is selected before final submission.</p>
            <p>2. Maximum file size allowed is <strong>20 MB per file</strong>. Files over 20 MB will be rejected by the backend.</p>
            <p>3. Allowed formats: PNG, JPG, JPEG, PDF, DOC, DOCX, MP4, MOV, AVI.</p>
            <p>4. Clicking <strong>Final Submit & Lock</strong> permanently locks your submission. You will not be able to modify files afterwards.</p>
          </CardContent>
        </Card>
      </div>

      {/* Final Submit Confirmation Modal */}
      <Dialog open={showFinalSubmitModal} onOpenChange={setShowFinalSubmitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <AlertTriangle className="h-5 w-5" /> Confirm Final Submission
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground">
              Are you sure you want to finalize and lock your project submission?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-amber-500/10 rounded-md border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold">⚠️ Submission Locking Notice</p>
            <p>Once finalized, your submission status changes to SUBMITTED and becomes locked. You will not be able to upload additional files or delete existing uploads.</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowFinalSubmitModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={finalSubmitMutation.isPending}
              onClick={handleFinalSubmit}
            >
              {finalSubmitMutation.isPending ? "Finalizing..." : "Confirm & Lock Submission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
