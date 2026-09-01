"use client";

import { useEffect, useRef } from "react";
import { haptic, trackCtaEvent, trackEvent } from "@/lib/analytics";
import { SITE_PATHS } from "@/lib/site-config";
import { CheckIcon } from "@/components/icons";

/** Lead capture section — form behavior ported 1:1 from main.js (posts to /api/lead). */

function populateUtmFields() {
  const params = new URLSearchParams(window.location.search);
  const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  utmFields.forEach((key) => {
    const field = document.getElementById(key) as HTMLInputElement | null;
    const val = params.get(key);
    if (field && val) {
      field.value = val;
    }
  });
  const pageField = document.getElementById("leadPage") as HTMLInputElement | null;
  if (pageField) {
    pageField.value = window.location.pathname;
  }
}

function showFormState(formStatus: HTMLElement | null, message: string, isError?: boolean) {
  if (!formStatus) return;
  formStatus.textContent = message || "";
  formStatus.classList.toggle("is-error", isError === true);
  formStatus.classList.toggle("is-success", isError === false);
  if (message === "") {
    formStatus.classList.remove("is-error", "is-success");
  }
}

function setFieldError(field: Element | null, isError: boolean, message?: string) {
  if (!field) return;
  const key = field.getAttribute("id");
  if (!key) return;
  const group = field.closest(".form-group");
  if (!group) return;

  let errorEl = group.querySelector(".field-error");
  if (!errorEl && isError) {
    errorEl = document.createElement("span");
    errorEl.className = "field-error";
    group.appendChild(errorEl);
  }

  if (errorEl) {
    errorEl.textContent = isError ? message || "" : "";
  }

  field.classList.toggle("is-invalid", Boolean(isError));
  field.setAttribute("aria-invalid", isError ? "true" : "false");
}

function validateLeadForm(form: HTMLFormElement): boolean {
  const requiredFields = form.querySelectorAll("[required]");
  let hasError = false;
  const email = form.querySelector<HTMLInputElement>("#email");
  const phone = form.querySelector<HTMLInputElement>("#phone");
  const firstName = form.querySelector<HTMLInputElement>("#firstName");
  const lastName = form.querySelector<HTMLInputElement>("#lastName");
  const service = form.querySelector<HTMLSelectElement>("#service");
  const details = form.querySelector<HTMLTextAreaElement>("#details");

  requiredFields.forEach((field) => {
    setFieldError(field, false);
  });

  [firstName, lastName, email].forEach((field) => {
    if (field && !field.value.trim()) {
      setFieldError(field, true, "This field is required.");
      hasError = true;
    }
  });

  if (email && email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
    setFieldError(email, true, "Please enter a valid email.");
    hasError = true;
  }

  if (service && service.value.length === 0) {
    setFieldError(service, true, "Please choose a service.");
    hasError = true;
  }

  if (phone && phone.value && phone.value.replace(/\D/g, "").length < 10) {
    setFieldError(phone, true, "Please enter a valid phone number.");
    hasError = true;
  }

  if (details && details.value.trim().length > 500) {
    setFieldError(details, true, "Please keep details under 500 characters.");
    hasError = true;
  }

  return hasError;
}

function setButtonState(button: HTMLButtonElement | null, enabled: boolean, label?: string) {
  if (!button) return;
  button.disabled = !enabled;
  if (typeof label === "string") {
    button.textContent = label;
  }
}

export default function LeadFormSection() {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    populateUtmFields();
  }, []);

  function submitLeadForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    haptic("medium");
    const form = event.currentTarget;
    const formStatus = document.getElementById("leadFormStatus");
    const submitBtn = form.querySelector<HTMLButtonElement>(".form-submit");
    const ctaBtn = form.querySelector("button[data-cta]");
    const buttonId = ctaBtn ? ctaBtn.getAttribute("data-cta") || "lead-submit" : "lead-submit";

    if (submitBtn) {
      trackCtaEvent(submitBtn, "lead_submit_attempt");
    }

    if (validateLeadForm(form)) {
      showFormState(formStatus, "Please fix the highlighted fields and try again.", true);
      trackEvent("lead_validation_error", { cta: buttonId, section: "lead_form" });
      return;
    }

    const honeypotField = form.querySelector<HTMLInputElement>("#leadHoneypot");
    const hp = honeypotField ? honeypotField.value : "";
    if (hp) {
      showFormState(formStatus, "Submission blocked.", true);
      trackEvent("lead_bot_blocked", { cta: buttonId, section: "lead_form" });
      return;
    }

    const originalBtnLabel = submitBtn ? submitBtn.textContent || "" : "";
    setButtonState(submitBtn, false, "Submitting...");
    showFormState(formStatus, "Submitting your request...");

    const buttonField = document.getElementById("leadButton") as HTMLInputElement | null;
    if (buttonField) {
      buttonField.value = buttonId;
    }

    const formData = new FormData(form);
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = (value || "").toString().trim();
    });

    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) =>
        response.text().then((rawText) => {
          let parsed: { ok?: boolean; duplicate?: boolean; message?: string };
          try {
            parsed = rawText ? JSON.parse(rawText) : {};
          } catch {
            parsed = { message: rawText || "Invalid server response." };
          }
          return { ok: response.ok, status: response.status, data: parsed };
        })
      )
      .then((result) => {
        if (result.data && result.data.duplicate) {
          showFormState(formStatus, "You already submitted this request recently. Tom will reach out shortly.", false);
          trackEvent("lead_duplicate", { cta: buttonId, section: "lead_form" });
          return;
        }

        if (!result.ok || !result.data || result.data.ok !== true) {
          throw new Error(
            (result.data && result.data.message) ||
              "Unable to submit your request. Please try again. (" + result.status + ")"
          );
        }

        const utmCampaignField = form.querySelector<HTMLInputElement>("#utm_campaign");
        const utmMediumField = form.querySelector<HTMLInputElement>("#utm_medium");
        trackEvent("lead_submit", {
          campaign: (utmCampaignField && utmCampaignField.value) || "n/a",
          service: payload.service || "unknown",
          medium: (utmMediumField && utmMediumField.value) || "direct",
          button: buttonId,
        });
        showFormState(formStatus, "Thanks! Your request was sent successfully.", false);
        form.reset();
        populateUtmFields();
        setTimeout(() => {
          window.location.assign(SITE_PATHS.thankYou);
        }, 900);
      })
      .catch((error: Error) => {
        showFormState(formStatus, error.message || "Network issue. Please try again in a moment.", true);
        trackEvent("lead_submit_error", {
          cta: buttonId,
          section: "lead_form",
          error: String((error && error.message) || "unknown"),
        });
      })
      .finally(() => {
        setButtonState(submitBtn, true, originalBtnLabel || "Request Free Estimate");
      });
  }

  return (
    <section className="section lead-capture" id="quote">
      <div className="container">
        <div className="lead-layout">
          <div className="lead-info fade-up">
            <div className="jobber-badge">
              <span className="badge-label">Secure lead intake</span>
            </div>
            <h2 className="section-headline">Request a quote in seconds.</h2>
            <p>Fill out the form and your request is delivered into our lead workflow with spam protection and source tracking. Tom personally reviews every request and usually responds within 24 hours to schedule your free consultation.</p>
            <div className="lead-features">
              <div className="lead-feature">
                <CheckIcon />
                <span>Fast delivery to our lead inbox or CRM</span>
              </div>
              <div className="lead-feature">
                <CheckIcon />
                <span>Spam-protected and duplicate-checked submissions</span>
              </div>
              <div className="lead-feature">
                <CheckIcon />
                <span>Tom responds within 24 hours</span>
              </div>
              <div className="lead-feature">
                <CheckIcon />
                <span>Campaign and page source tracking built in</span>
              </div>
            </div>
          </div>
          <div className="lead-form-wrap fade-right">
            <form className="lead-form" id="leadForm" method="post" action="/api/lead" noValidate ref={formRef} onSubmit={submitLeadForm}>
              <h3>Get Your Free Estimate</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input type="text" id="firstName" name="firstName" required placeholder="Tom" autoComplete="given-name" />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input type="text" id="lastName" name="lastName" required placeholder="Smith" autoComplete="family-name" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required placeholder="you@email.com" autoComplete="email" />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input type="tel" id="phone" name="phone" placeholder="Your phone number" autoComplete="tel" inputMode="tel" />
              </div>
              <div className="form-group">
                <label htmlFor="service">Service Needed</label>
                <select id="service" name="service" required defaultValue="">
                  <option value="">Select a service...</option>
                  <option value="hardwood">Hardwood Flooring</option>
                  <option value="lvp">Luxury Vinyl Plank (LVP)</option>
                  <option value="laminate">Laminate Flooring</option>
                  <option value="carpet">Carpet</option>
                  <option value="other">Other / Not Sure</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="details">Project Details <span className="optional">(optional)</span></label>
                <textarea id="details" name="details" rows={3} placeholder="Room size, current flooring, timeline, etc." maxLength={500}></textarea>
              </div>
              <div className="form-group honeypot">
                <label htmlFor="leadHoneypot">Leave this field empty</label>
                <input type="text" id="leadHoneypot" name="hp" autoComplete="off" tabIndex={-1} />
              </div>
              <input type="hidden" id="utm_source" name="utm_source" defaultValue="" />
              <input type="hidden" id="utm_medium" name="utm_medium" defaultValue="" />
              <input type="hidden" id="utm_campaign" name="utm_campaign" defaultValue="" />
              <input type="hidden" id="utm_content" name="utm_content" defaultValue="" />
              <input type="hidden" id="utm_term" name="utm_term" defaultValue="" />
              <input type="hidden" id="leadPage" name="leadPage" defaultValue="" />
              <input type="hidden" id="leadButton" name="leadButton" defaultValue="" />
              <input type="hidden" id="leadSource" name="leadSource" defaultValue="homepage_quote_form" />
              <button type="submit" className="btn btn-primary form-submit" data-cta="lead-submit">
                Request Free Estimate
              </button>
              <p className="form-note">No spam. No obligation. Your info stays with Tom.</p>
              <div id="leadFormStatus" className="form-feedback" aria-live="polite" role="status" aria-atomic="true"></div>
            </form>
            {/*
              Lead routing note (dev only)
              Delivery options supported by /api/lead:
              1. Lead webhook (Zapier / Make / Jobber bridge / custom CRM)
              2. Resend email fallback
              3. FormSubmit fallback for low-friction delivery
              4. Duplicate suppression + basic rate limiting
              5. UTM, page, and CTA source tracking
            */}
          </div>
        </div>
      </div>
    </section>
  );
}
