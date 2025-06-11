import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/react";
import { createFileRoute } from "@tanstack/react-router";
import { FileUpIcon, PlusIcon, UploadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/(app)/candidates/bulk-upload")({
  component: BulkUploadPage,
});

function BulkUploadPage() {
  const trpc = useTRPC();
  const [csvData, setCsvData] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const bulkUploadMutation = trpc.candidates.bulkUpload.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully uploaded ${data.length} candidates`);
      setCsvData("");
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const candidate: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        switch (header) {
          case 'name':
            candidate.name = value;
            break;
          case 'surname':
            candidate.surname = value;
            break;
          case 'email':
            candidate.email = value;
            break;
          case 'tel number':
          case 'phone':
          case 'telephone':
            candidate.telNumber = value;
            break;
          case 'date of birth':
          case 'dob':
          case 'birth date':
            candidate.dateOfBirth = value;
            break;
          case 'linkedin':
          case 'linkedin url':
            candidate.linkedIn = value;
            break;
        }
      });
      
      return candidate;
    }).filter(candidate => candidate.name && candidate.surname && candidate.email);
  };

  const handleBulkUpload = async () => {
    if (!csvData.trim()) {
      toast.error("Please provide CSV data or upload a file");
      return;
    }

    setIsUploading(true);
    try {
      const candidates = parseCsvData(csvData);
      if (candidates.length === 0) {
        toast.error("No valid candidates found in the data");
        return;
      }
      
      await bulkUploadMutation.mutateAsync(candidates);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bulk Upload Candidates</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUpIcon className="w-5 h-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Expected CSV format:</p>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  Name,Surname,Email,Tel Number,Date of Birth,LinkedIn<br/>
                  John,Doe,john@example.com,+1234567890,1990-01-01,https://linkedin.com/in/johndoe
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Manual CSV Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-data">CSV Data</Label>
                <Textarea
                  id="csv-data"
                  placeholder="Name,Surname,Email,Tel Number,Date of Birth,LinkedIn&#10;John,Doe,john@example.com,+1234567890,1990-01-01,https://linkedin.com/in/johndoe"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  rows={10}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      {csvData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {(() => {
                  try {
                    const candidates = parseCsvData(csvData);
                    return `${candidates.length} valid candidates found`;
                  } catch {
                    return "Invalid CSV format";
                  }
                })()}
              </div>
              <Button 
                onClick={handleBulkUpload}
                disabled={isUploading || !csvData.trim()}
                className="w-full"
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Candidates"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
