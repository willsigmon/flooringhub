"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { SITE_CONFIG } from "@/lib/site-config";

const FAQ_ITEMS: Array<{ question: string; answer: React.ReactNode }> = [
  {
    question: "What types of flooring does Flooring Hub specialize in?",
    answer: (
      <p>Hardwood, laminate, luxury vinyl plank (LVP), carpeted flooring, custom inlays, and more. We handle the full spectrum of residential and commercial flooring.</p>
    ),
  },
  {
    question: "Do you offer floor leveling?",
    answer: (
      <p>Yes. We provide full-pour leveling services using high-performance self-leveling compounds as part of our prep services.</p>
    ),
  },
  {
    question: "How do I get a quote?",
    answer: (
      <p>
        Call us at <a href={`tel:${SITE_CONFIG.phone}`} data-config-phone="text">{SITE_CONFIG.phoneDisplay}</a> or{" "}
        <a href={`mailto:${SITE_CONFIG.email}`} data-config-email="">email us</a> to schedule a free in-home or on-site consultation. No obligation.
      </p>
    ),
  },
  {
    question: "Why is professional installation important?",
    answer: (
      <p>Professional installation ensures quality, longevity, and a flawless finish. We follow strict national standards and manufacturer guidelines to protect your warranty and investment.</p>
    ),
  },
  {
    question: "Can you handle complex flooring projects?",
    answer: (
      <p>Absolutely. We specialize in custom trim, staircases, moisture mitigation, and challenging layouts. No project is too complex for our team.</p>
    ),
  },
  {
    question: "What areas do you service?",
    answer: (
      <p>We proudly serve the greater Raleigh-Durham area. See our full <a href="#service-area">service area</a> for all covered cities.</p>
    ),
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="section faq" id="faq">
      <div className="container">
        <h2 className="section-label fade-up">FAQ</h2>
        <p className="section-headline fade-up">Common questions, straight answers.</p>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div className={"faq-item fade-up" + (openIndex === i ? " open" : "")} key={item.question}>
              <button
                className="faq-question"
                aria-expanded={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span>{item.question}</span>
                <ChevronDownIcon className="faq-chevron" />
              </button>
              <div className="faq-answer">{item.answer}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
