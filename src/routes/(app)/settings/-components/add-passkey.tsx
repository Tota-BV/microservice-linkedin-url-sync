"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Fingerprint, Loader2, Plus } from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function AddPasskey() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPasskey = async () => {
    if (!passkeyName) {
      toast.error("Passkey name is required");
      return;
    }
    setIsLoading(true);
    const res = await authClient.passkey.addPasskey({
      name: passkeyName,
    });
    if (res?.error) {
      toast.error(res?.error.message);
    } else {
      setIsOpen(false);
      toast.success("Passkey added successfully. You can now use it to login.");
    }
    setIsLoading(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-xs md:text-sm">
          <Plus size={15} />
          {t("ADD_NEW_PASSKEY")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-11/12">
        <DialogHeader>
          <DialogTitle>{t("ADD_NEW_PASSKEY")}</DialogTitle>
          <DialogDescription>{t("ADD_PASSKEY_DESC")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="passkey-name">{t("PASSKEY_NAME")}</Label>
          <Input
            id="passkey-name"
            value={passkeyName}
            onChange={(e) => setPasskeyName(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={isLoading}
            type="submit"
            onClick={handleAddPasskey}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                {t("CREATE_PASSKEY")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
