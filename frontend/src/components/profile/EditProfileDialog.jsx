import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function EditProfileDialog({
  open,
  onOpenChange,
  title = 'Edit Profile',
  description = 'Update your profile information and preferences below.',
  initialData = {},
  fields = [],
  onSave,
  saving = false,
  submitLabel = 'Save Changes',
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (open) {
      setFormData({ ...initialData });
    }
  }, [open, initialData]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B] tracking-tight">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-[#64748B]">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {fields.map((field) => {
              const isFullWidth = field.fullWidth || field.type === 'textarea';
              const inputId = `field-${field.name}`;

              return (
                <div
                  key={field.name}
                  className={`space-y-1.5 ${isFullWidth ? 'sm:col-span-2' : ''}`}
                >
                  <Label
                    htmlFor={inputId}
                    className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider"
                  >
                    {field.label}
                    {field.required && <span className="text-[#DC2626] ml-1">*</span>}
                  </Label>

                  {field.type === 'textarea' ? (
                    <Textarea
                      id={inputId}
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      rows={field.rows || 3}
                      className="border-[#E2E8F0] focus-visible:ring-[#0F766E] text-sm text-[#1E293B]"
                    />
                  ) : (
                    <Input
                      id={inputId}
                      name={field.name}
                      type={field.type || 'text'}
                      value={formData[field.name] ?? ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="h-[44px] border-[#E2E8F0] focus-visible:ring-[#0F766E] text-sm text-[#1E293B]"
                      required={field.required}
                    />
                  )}

                  {field.helperText && (
                    <p className="text-[11px] text-[#64748B]">{field.helperText}</p>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="coral"
              disabled={saving}
              className="bg-[#FF6B6B] text-[#1E293B] hover:bg-[#EE5A5A] font-bold shadow-xs transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
