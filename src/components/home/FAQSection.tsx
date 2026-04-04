import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Is this safe?", a: "Yes! All travelers build verified profiles with real reviews. Hosts are community members who have been vetted through trip hosting experience and traveler feedback." },
  { q: "Who are the hosts?", a: "Hosts are experienced travelers from the community who plan and lead group trips. They set the itinerary, manage logistics, and ensure everyone has a great time." },
  { q: "How do I join a trip?", a: "Browse trips, find one you love, and book directly. For curated trips, you may need to apply — the host reviews applications to ensure a great group fit." },
  { q: "How are payments handled?", a: "Payments are handled directly between you and the host. Details are shared after booking confirmation so you can coordinate securely." },
];

const FAQSection = () => (
  <section className="bg-muted/30 py-14">
    <div className="mx-auto max-w-2xl px-4">
      <h2 className="mb-2 text-center text-2xl font-bold text-foreground md:text-3xl">
        Frequently Asked Questions
      </h2>
      <p className="mb-8 text-center text-muted-foreground">Got questions? We've got answers.</p>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-foreground">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQSection;
