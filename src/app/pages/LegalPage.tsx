import { useParams, Link } from "react-router";
import { useEffect } from "react";
import { ArrowLeft, Shield, FileText, Lock, Cookie } from "lucide-react";

const LEGAL_CONTENT: Record<string, {
  title: string;
  icon: React.ReactNode;
  sections: { heading: string; text: string }[];
}> = {
  "mentions-legales": {
    title: "Mentions légales",
    icon: <FileText size={28} className="text-[#00A651]" />,
    sections: [
      {
        heading: "Éditeur du site",
        text: "NFI REPORT est édité par la société Niger Financial Insights, dont le siège social est situé au Quartier Plateau, Niamey, République du Niger. Directeur de la publication : Hassane Ibrahim.",
      },
      {
        heading: "Contact",
        text: "Pour toute question relative au site, vous pouvez nous contacter par e-mail à l'adresse contact@nfireport.com ou par téléphone au +227 98 54 38 37.",
      },
      {
        heading: "Hébergement",
        text: "Le site NFI REPORT est hébergé par des serveurs sécurisés. Pour toute question technique relative à l'hébergement, veuillez contacter contact@nfireport.com.",
      },
      {
        heading: "Propriété intellectuelle",
        text: "L'ensemble des contenus présents sur le site NFI REPORT (textes, images, graphiques, logos, vidéos, etc.) sont protégés par le droit d'auteur et sont la propriété exclusive de Niger Financial Insights, sauf mention contraire. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de Niger Financial Insights.",
      },
      {
        heading: "Responsabilité",
        text: "NFI REPORT s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Cependant, NFI REPORT ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur ce site. Les informations publiées sur NFI REPORT sont à caractère général et ne constituent en aucun cas un conseil financier ou d'investissement.",
      },
      {
        heading: "Droit applicable",
        text: "Les présentes mentions légales sont soumises au droit nigérien. En cas de litige, les tribunaux compétents de Niamey seront seuls habilités à connaître du différend.",
      },
    ],
  },
  "confidentialite": {
    title: "Politique de confidentialité",
    icon: <Lock size={28} className="text-[#00A651]" />,
    sections: [
      {
        heading: "Collecte des données",
        text: "NFI REPORT collecte des données personnelles uniquement dans le cadre de votre inscription à notre newsletter, de la création de votre compte abonné ou de votre prise de contact via notre formulaire. Les données collectées sont : nom, adresse e-mail, et le cas échéant des informations de paiement pour les abonnements premium.",
      },
      {
        heading: "Utilisation des données",
        text: "Vos données personnelles sont utilisées pour vous fournir nos services, vous envoyer notre newsletter (si vous y avez souscrit), vous informer de nos offres et pour améliorer notre service. Nous ne vendons, ne louons et ne partageons vos données personnelles avec des tiers à des fins commerciales.",
      },
      {
        heading: "Conservation des données",
        text: "Vos données personnelles sont conservées pendant la durée de votre abonnement ou de votre inscription, et jusqu'à 3 ans après la fin de la relation commerciale, conformément aux obligations légales en vigueur.",
      },
      {
        heading: "Vos droits",
        text: "Conformément à la réglementation applicable, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant à l'adresse contact@nfireport.com. Toute demande sera traitée dans un délai de 30 jours.",
      },
      {
        heading: "Sécurité",
        text: "NFI REPORT met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.",
      },
      {
        heading: "Contact DPO",
        text: "Pour toute question relative à la protection de vos données personnelles, vous pouvez contacter notre délégué à la protection des données à l'adresse : contact@nfireport.com.",
      },
    ],
  },
  "cgu": {
    title: "Conditions Générales d'Utilisation",
    icon: <Shield size={28} className="text-[#00A651]" />,
    sections: [
      {
        heading: "Objet",
        text: "Les présentes Conditions Générales d'Utilisation (CGU) définissent les modalités d'accès et d'utilisation du site NFI REPORT accessible à l'adresse nfireport.com. Toute connexion au site implique l'acceptation sans réserve des présentes CGU.",
      },
      {
        heading: "Accès au service",
        text: "NFI REPORT propose un accès gratuit à une partie de ses contenus et un accès premium via abonnement. NFI REPORT se réserve le droit de modifier, suspendre ou interrompre tout ou partie du service à tout moment, sans préavis.",
      },
      {
        heading: "Compte utilisateur",
        text: "La création d'un compte est nécessaire pour accéder aux contenus premium. Vous êtes responsable de la confidentialité de vos identifiants de connexion. Tout usage frauduleux de votre compte doit être signalé immédiatement à contact@nfireport.com.",
      },
      {
        heading: "Abonnements",
        text: "Les abonnements premium sont proposés à des tarifs définis sur la page Abonnement. Les abonnements sont renouvelés automatiquement sauf résiliation avant la date d'échéance. Vous pouvez résilier votre abonnement à tout moment depuis votre espace personnel.",
      },
      {
        heading: "Comportement de l'utilisateur",
        text: "Vous vous engagez à utiliser le site de manière conforme aux lois et règlements en vigueur, et à ne pas porter atteinte aux droits des tiers. Toute utilisation commerciale, reproduction ou diffusion des contenus sans autorisation préalable est strictement interdite.",
      },
      {
        heading: "Modification des CGU",
        text: "NFI REPORT se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle. La poursuite de l'utilisation du site après modification vaut acceptation des nouvelles CGU.",
      },
    ],
  },
  "cookies": {
    title: "Politique de cookies",
    icon: <Cookie size={28} className="text-[#00A651]" />,
    sections: [
      {
        heading: "Qu'est-ce qu'un cookie ?",
        text: "Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette ou mobile) lors de votre visite sur notre site. Il permet au site de mémoriser vos préférences et d'améliorer votre expérience de navigation.",
      },
      {
        heading: "Cookies essentiels",
        text: "Ces cookies sont indispensables au fonctionnement du site. Ils vous permettent de naviguer et d'utiliser les fonctionnalités du site, comme accéder à votre espace personnel ou conserver votre session. Sans ces cookies, les services ne peuvent pas fonctionner correctement.",
      },
      {
        heading: "Cookies analytiques",
        text: "Nous utilisons des outils d'analyse (PostHog) pour mesurer l'audience et analyser l'utilisation de notre site afin d'en améliorer les performances et le contenu. Ces données sont collectées de manière anonymisée et agrégée.",
      },
      {
        heading: "Cookies de performance",
        text: "Ces cookies nous permettent de surveiller les erreurs et les performances techniques du site (Sentry). Ils nous aident à identifier et corriger rapidement les problèmes pour garantir la meilleure expérience possible.",
      },
      {
        heading: "Gestion de vos préférences",
        text: "Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres de votre navigateur. Notez que la désactivation de certains cookies peut affecter votre expérience de navigation sur notre site.",
      },
      {
        heading: "Durée de conservation",
        text: "Les cookies essentiels sont conservés le temps de votre session. Les cookies analytiques et de performance sont conservés pour une durée maximale de 13 mois, conformément aux recommandations en vigueur.",
      },
    ],
  },
};

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const content = slug ? LEGAL_CONTENT[slug] : null;

  useEffect(() => {
    if (!content || !slug) return;
    document.title = `${content.title} — NFI REPORT`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", `${content.title} de NFI REPORT — Niger Financial Insights. Informations légales et réglementaires.`);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", `https://www.nfireport.com/legal/${slug}`);
    return () => {
      document.title = "NFI REPORT - La référence financière et économique au Niger";
      document.querySelector('meta[name="description"]')?.setAttribute("content", "NFI REPORT — Actualités économiques et financières en Afrique. Analyses indépendantes, données de marché, focus Niger, BCEAO, UEMOA et économie mondiale.");
      const can = document.querySelector('link[rel="canonical"]');
      if (can) can.setAttribute("href", "https://www.nfireport.com/");
    };
  }, [slug, content?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Page introuvable.</p>
          <Link to="/" className="text-[#00A651] hover:underline text-sm">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0D1B35]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors mb-6"
          >
            <ArrowLeft size={15} /> Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3 mb-2">
            {content.icon}
            <h1 className="text-white">{content.title}</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Dernière mise à jour : janvier 2026 · NFI REPORT
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border p-6 sm:p-8 space-y-8" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
          {content.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-[#0D1B35] mb-2 pb-2 border-b" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                {section.heading}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs mb-2">
            Des questions ? Contactez-nous
          </p>
          <a
            href="mailto:contact@nfireport.com"
            className="text-[#00A651] text-sm hover:underline"
          >
            contact@nfireport.com
          </a>
        </div>
      </div>
    </div>
  );
}
