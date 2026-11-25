import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Send,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Building2,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { inquiryService } from '@/services/inquiryService';
import { INQUIRY_TOPICS, buildInquiryMessage } from '@/utils/contactHelpers';

const ANY_BRANCH_VALUE = '__any__';

export default function ContactInquiryForm({
  branches = [],
  selectedBranchId = '',
  onBranchChange,
  responseTime,
  fallbackPhone,
  fallbackTelHref,
  whatsappUrl,
}) {
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [topicValue, setTopicValue] = useState(INQUIRY_TOPICS[0].value);
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const selectedTopic = INQUIRY_TOPICS.find((t) => t.value === topicValue) || INQUIRY_TOPICS[0];
  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || null;
  const branchSelectValue = selectedBranch ? selectedBranch.id : ANY_BRANCH_VALUE;

  const handleBranchSelect = (val) => {
    onBranchChange?.(val === ANY_BRANCH_VALUE ? '' : val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactInfo.trim() || !contactMessage.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const trimmedInfo = contactInfo.trim();
      const isEmail = trimmedInfo.includes('@');
      const slugName = contactName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'client';

      await inquiryService.submitInquiry({
        name: contactName.trim(),
        email: isEmail ? trimmedInfo : `${slugName}@lead.client.ph`,
        phone: !isEmail ? trimmedInfo : undefined,
        message: buildInquiryMessage({
          topicLabel: selectedTopic.label,
          branchName: selectedBranch ? selectedBranch.title : 'Any / Nearest Branch',
          message: contactMessage,
        }),
        type: selectedTopic.inquiryType,
        source: 'contact_page',
      });

      setIsSubmitted(true);
    } catch {
      setSubmitError(
        'We could not send your message right now. Your details are still saved below—please try again or reach us directly by phone or WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setContactName('');
    setContactInfo('');
    setContactMessage('');
    setSubmitError('');
    setIsSubmitted(false);
  };

  return (
    <Card
      id="contact-form"
      className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs scroll-mt-24"
    >
      <CardHeader className="p-6 md:p-8 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-[#1E293B]">
          Send Us a Message
        </CardTitle>
        <CardDescription className="text-sm text-[#64748B]">
          Share a few quick details and we will connect you with the right branch advisor.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 md:px-8 pb-6 md:pb-8">
        {isSubmitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-4">
            <div className="size-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-2 max-w-md">
              <h3 className="text-xl font-semibold text-[#1E293B]">Message Received</h3>
              <p className="text-sm text-[#64748B]">
                Thank you, {contactName}.{' '}
                {selectedBranch
                  ? `Your message has been routed to our ${selectedBranch.title} team.`
                  : 'An advisor from our nearest branch will reach out shortly.'}
              </p>
              {responseTime && (
                <p className="text-xs text-[#0F766E] font-medium">{responseTime}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg" className="min-h-11 rounded-lg normal-case tracking-normal text-sm">
                <Link to="/properties">
                  <span>Browse Listings</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleReset}
                className="min-h-11 rounded-lg normal-case tracking-normal text-sm"
              >
                Send Another Message
              </Button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertTitle>Could not send your message</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <span>{submitError}</span>
                  <div className="flex flex-wrap gap-4 pt-1">
                    {fallbackTelHref && fallbackPhone && (
                      <a href={fallbackTelHref} className="font-semibold underline">
                        Call {fallbackPhone}
                      </a>
                    )}
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline"
                      >
                        Chat on WhatsApp
                      </a>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Your Name
              </Label>
              <Input
                id="contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="How should we address you?"
                required
                className="h-11 bg-[#F8FAFC] border-[#E2E8F0] focus-visible:bg-white focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-lg text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-info" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Email or Phone
              </Label>
              <Input
                id="contact-info"
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Your email address or mobile number"
                required
                className="h-11 bg-[#F8FAFC] border-[#E2E8F0] focus-visible:bg-white focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact-topic" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  I Am Looking To
                </Label>
                <Select value={topicValue} onValueChange={setTopicValue}>
                  <SelectTrigger
                    id="contact-topic"
                    className="w-full h-11 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                  >
                    <Tag className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white border border-[#E2E8F0]">
                    <SelectGroup>
                      {INQUIRY_TOPICS.map((topic) => (
                        <SelectItem key={topic.value} value={topic.value}>
                          {topic.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="contact-branch" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Preferred Branch
                </Label>
                <Select value={branchSelectValue} onValueChange={handleBranchSelect}>
                  <SelectTrigger
                    id="contact-branch"
                    className="w-full h-11 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                  >
                    <Building2 className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                    <SelectValue placeholder="Any / Nearest Branch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white border border-[#E2E8F0]">
                    <SelectGroup>
                      <SelectItem value={ANY_BRANCH_VALUE}>Any / Nearest Branch</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                How Can We Help?
              </Label>
              <Textarea
                id="contact-message"
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Tell us the area, budget, or property type you have in mind..."
                required
                className="bg-[#F8FAFC] border-[#E2E8F0] focus-visible:bg-white focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-lg text-sm resize-none"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full h-12 rounded-lg text-sm font-semibold normal-case tracking-normal mt-2"
            >
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              {!isSubmitting && <Send className="size-4" aria-hidden="true" />}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-[#64748B] pt-1">
              <ShieldCheck className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
              <span>Your details stay private and are only used to reply to your inquiry.</span>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
