'use client';

const quickLinks = [
  {
    title: 'Documentation',
    description: 'Comprehensive guides, API references, and integration tutorials for building with SODAX.',
    badges: ['SDK reference', 'Guides', 'Examples'],
    href: 'https://docs.sodax.com',
  },
  {
    title: 'GitHub',
    description: 'Explore our open-source SDKs, example implementations, and contribute to the ecosystem.',
    badges: ['Open source', 'SDKs', 'Examples'],
    href: 'https://github.com/icon-project/sodax',
  },
  {
    title: 'Discord Community',
    description: 'Connect with other builders, get technical support, and stay updated on new features.',
    badges: ['Support', 'Builders', 'Updates'],
    href: 'https://discord.gg/xM2Nh4S6vN',
  },
];

export default function PartnersCtaSection() {
  return (
    <section className="bg-cream-white overflow-clip px-4 md:px-8 py-30" aria-label="Partner Call to Action">
      <div className="flex flex-col gap-10 items-center max-w-236 mx-auto w-full">
        {/* CTA Container */}
        <div className="flex flex-col gap-8 items-center">
          {/* Title */}
          <h2 className="font-['InterBold'] text-[32px] leading-[1.1] text-espresso text-center max-w-140">
            Deliver cross-network actions. <span className="text-yellow-dark">Skip the infrastructure work.</span>
          </h2>

          {/* Subtitle */}
          <p className="font-['InterRegular'] text-[18px] leading-[1.2] text-espresso text-center max-w-100">
            SODAX coordinates execution so you can focus on building your application.
          </p>

          {/* CTA Button */}
          <a
            href="https://docs.sodax.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cherry-bright flex h-10 items-center justify-center px-6 py-2 rounded-full"
          >
            <span className="font-['InterMedium'] text-[14px] leading-[1.4] text-white text-center">
              View documentation
            </span>
          </a>

          {/* Email Note */}
          <p className="font-['InterRegular'] text-[14px] leading-[1.4] text-center">
            <span className="text-espresso">Reach out to </span>
            <a href="mailto:partnerships@sodax.com" className="text-clay hover:underline">
              partnerships@sodax.com
            </a>
          </p>
        </div>

        {/* Quick Link Cards */}
        <div className="flex flex-wrap justify-center gap-4 w-full">
          {quickLinks.map(link => (
            <a
              key={link.title}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-3xl flex flex-col gap-4 items-start justify-center pt-12 pb-6 px-6 w-full sm:w-76 hover:opacity-90 transition-opacity"
            >
              <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso">{link.title}</h3>
              <p className="font-['InterRegular'] text-[14px] leading-[1.4] text-clay-dark w-full">
                {link.description}
              </p>
              <div className="flex gap-1 items-start flex-wrap">
                {link.badges.map(badge => (
                  <span
                    key={badge}
                    className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
