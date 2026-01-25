"use client";

import { useState } from "react";

/* ====================
   FAQ Data - Matches Webflow Design
==================== */

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "Do my friends and family need an account to use my list?",
    answer:
      "No, guests can view your wishlist, reserve, or chip in without signing up.",
  },
  {
    question: "Can I contribute money instead of buying the gift?",
    answer:
      "Absolutely! Chip in for a group gift or let others join the fun. Desira makes it easy to contribute cash or buy directly, your choice.",
  },
  {
    question: "How does Desira prevent duplicate gifts?",
    answer:
      "When someone reserves an item, it's marked as taken for everyone else, so no one accidentally buys the same thing.",
  },
  {
    question: "Will the recipient know who bought what?",
    answer:
      "Nope! We keep it hush-hush. Gift details and givers stay hidden until it's time to celebrate, so the surprise is always safe.",
  },
  {
    question: "Can I turn off contributions and keep it \"reserve only\"?",
    answer:
      "Yes. You can disable contributions anytime and use Desira purely for reservations.",
  },
  {
    question: "How do I buy an item I reserved?",
    answer:
      "Open the item and use the product link to purchase it like normal. Desira simply helps you keep track and avoid duplicates.",
  },
  {
    question: "What kinds of wishlists can I make?",
    answer:
      "Anything: birthdays, holidays, weddings, baby registries, housewarmings, or even \"one gift for the whole family.\"",
  },
];

/* ====================
   Chevron Icon
==================== */

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ====================
   Accordion Item Component
==================== */

interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: AccordionItemProps) {
  return (
    <div className="accordion-item">
      <button
        className="accordion-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <ChevronDownIcon
          className={`text-[var(--text-muted)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className="accordion-content"
        data-open={isOpen}
        style={{
          maxHeight: isOpen ? "500px" : "0",
          paddingBottom: isOpen ? "1.25rem" : "0",
        }}
      >
        <p>{answer}</p>
      </div>
    </div>
  );
}

/* ====================
   FAQ Section Component
==================== */

export function FAQSection(): React.ReactElement {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number): void => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section id="faq" className="section-padding px-5 sm:px-8">
      <div className="container-narrow mx-auto">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 className="text-h2 text-[var(--text-primary)]">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-lg text-[var(--text-secondary)]">
            Gifting, unwrapped — everything you need to know before sharing your
            wishlist.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] px-5">
          {FAQ_DATA.map((item, index) => (
            <AccordionItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openItems.has(index)}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
