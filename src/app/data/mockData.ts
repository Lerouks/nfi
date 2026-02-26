// ============================================================
// NFI REPORT — Mock Data
// ============================================================
import redactionAvatar from "@/assets/66e50a62702000f7e8b34cda9a4a1f13bc5306f7.png";

export interface Author {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  articles: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  author: Author;
  category: string;
  categorySlug: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
  isPremium: boolean;
  featured?: boolean;
  views: number;
  comments: number;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  date: string;
  likes: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  badge?: string;
  features: string[];
  highlighted: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  linkedin?: string;
  twitter?: string;
}

// ============================================================
// AUTHORS
// ============================================================
export const AUTHORS: Author[] = [
  {
    id: "a1",
    name: "La Rédaction NFI",
    role: "Rédaction",
    avatar: redactionAvatar,
    bio: "L'équipe de rédaction de NFI REPORT regroupe des journalistes et analystes spécialisés en économie africaine, finance et marchés émergents.",
    articles: 90,
  },
  {
    id: "a2",
    name: "Fatoumata Diallo",
    role: "Analyste Marchés",
    avatar: redactionAvatar,
    bio: "Diplômée en économie internationale, Fatoumata est spécialisée dans l'analyse des marchés émergents et des flux d'investissements en Afrique subsaharienne.",
    articles: 88,
  },
  {
    id: "a3",
    name: "Adamou Maïga",
    role: "Correspondant Niger",
    avatar: redactionAvatar,
    bio: "Journaliste nigérien basé à Niamey, Adamou couvre les questions politiques et économiques au Niger et dans le Sahel pour NFI REPORT.",
    articles: 27,
  },
  {
    id: "a4",
    name: "Ousmane Konaté",
    role: "Analyste Senior",
    avatar: redactionAvatar,
    bio: "Spécialiste en finance islamique et économie du développement, Ousmane contribue aux analyses sur les modèles financiers alternatifs en Afrique de l'Ouest.",
    articles: 7,
  },
];

// ============================================================
// ARTICLES
// ============================================================
export const ARTICLES: Article[] = [
  {
    id: "art1",
    title: "La BCEAO relève ses taux directeurs : impact sur le crédit aux PME en zone UEMOA",
    slug: "bceao-taux-directeurs-credit-pme-uemoa",
    excerpt: "La Banque Centrale des États de l'Afrique de l'Ouest a annoncé une hausse de 50 points de base de ses principaux taux directeurs, une décision qui suscite des inquiétudes dans le secteur des petites et moyennes entreprises.",
    content: `La Banque Centrale des États de l'Afrique de l'Ouest (BCEAO) a procédé à une hausse de 50 points de base de ses taux directeurs lors de son dernier Comité de Politique Monétaire. Cette décision, prise dans un contexte inflationniste persistant, aura des répercussions directes sur le coût du crédit pour les entreprises de la zone UEMOA.

**Contexte macroéconomique**

L'inflation dans la zone UEMOA a atteint 4,2% en glissement annuel, dépassant pour la troisième fois consécutive la cible de 3% fixée par la BCEAO. Cette pression inflationniste est principalement alimentée par la hausse des prix alimentaires et des coûts énergétiques, eux-mêmes liés aux tensions géopolitiques internationales.

**Impact sur le financement des PME**

Les PME, qui représentent plus de 80% du tissu économique de la zone UEMOA, risquent d'être les premières victimes de ce resserrement monétaire. Le taux moyen des crédits bancaires, déjà élevé à 8,5%, pourrait franchir la barre des 9% dans les prochains mois.

"Nous sommes préoccupés par cette décision. Nos membres ont déjà du mal à accéder au financement et une hausse supplémentaire des taux risque d'asphyxier leur développement", a déclaré le président de la Chambre de Commerce et d'Industrie du Sénégal.

**Perspectives et alternatives**

Plusieurs alternatives sont envisagées pour atténuer l'impact sur les PME :
- Le développement des mécanismes de garantie publique
- L'essor de la finance islamique comme alternative
- Le renforcement des fonds de capital-risque dédiés aux PME africaines

La BCEAO a toutefois indiqué qu'elle surveillerait de près l'évolution de la situation et n'excluait pas un assouplissement de sa politique si les pressions inflationnistes devaient s'atténuer.`,
    cover: "https://images.unsplash.com/photo-1579226905180-636b76d96082?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Économie Africaine",
    categorySlug: "economie-africaine",
    tags: ["BCEAO", "UEMOA", "PME", "Politique monétaire", "Crédit"],
    publishedAt: "2026-02-24T08:30:00",
    readTime: 7,
    isPremium: false,
    featured: true,
    views: 8420,
    comments: 43,
  },
  {
    id: "art2",
    title: "Investissements chinois en Afrique : vers un nouveau paradigme post-Forum de Beijing",
    slug: "investissements-chinois-afrique-forum-beijing",
    excerpt: "Après le Forum sur la Coopération Sino-Africaine, les promesses d'investissement de 50 milliards USD soulèvent des questions sur les conditions et la gouvernance de ces flux financiers.",
    content: `Le dernier Forum sur la Coopération Sino-Africaine a été marqué par des annonces de financement massives. Mais au-delà des chiffres spectaculaires, quelles sont les réalités de cet engagement économique ?

**Les chiffres en perspective**

La Chine a promis 50 milliards USD d'investissements sur les cinq prochaines années sur le continent africain. Ce montant, bien qu'impressionnant, doit être mis en perspective avec les engagements passés et leur niveau de réalisation effectif.

**Secteurs prioritaires**

Les investissements chinois se concentrent désormais sur :
- Les infrastructures numériques (câbles sous-marins, 5G)
- Les énergies renouvelables, notamment le solaire
- L'industrie manufacturière et les zones économiques spéciales
- L'agro-industrie

**Conditions et gouvernance**

La question de la conditionnalité de ces prêts reste centrale dans le débat public africain. Plusieurs économistes africains plaident pour une meilleure transparence dans les contrats et un renforcement des clauses de développement local.`,
    cover: "https://images.unsplash.com/photo-1588623731810-171b80f3c55e?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Économie Mondiale",
    categorySlug: "economie-mondiale",
    tags: ["Chine", "Investissement", "Forum Sino-Africain", "Infrastructure"],
    publishedAt: "2026-02-23T10:00:00",
    readTime: 9,
    isPremium: true,
    featured: true,
    views: 12300,
    comments: 87,
  },
  {
    id: "art3",
    title: "Niger : le secteur minier post-coup d'État, entre espoirs et incertitudes",
    slug: "niger-secteur-minier-post-coup-etat",
    excerpt: "Un an après les turbulences politiques, le secteur minier nigérien tente de se repositionner. L'uranium, l'or et le pétrole restent des atouts majeurs mais les défis d'exploitation demeurent nombreux.",
    content: `Le Niger, riche en ressources naturelles, traverse une période charnière pour son secteur extractif. Entre réorientation des partenariats et quête d'investisseurs alternatifs, le pays cherche à valoriser son sous-sol dans un contexte gopolitique complexe.

**Les ressources en jeu**

Le Niger possède les cinquièmes réserves mondiales d'uranium et des gisements aurifères significatifs dans la région de Tillabéri. Le pétrole, exploité dans la région d'Agadem, représente également un potentiel énergétique considérable.

**Réorientation des partenariats**

Après la suspension de plusieurs contrats avec des opérateurs occidentaux, le gouvernement de transition cherche à diversifier ses partenaires. Des discussions sont en cours avec des compagnies russes, turques et émiraties.

**Impact sur les communautés locales**

Les populations des zones minières expriment des attentes fortes en termes de retombées économiques locales. La question du contenu local et des royalties reversées aux régions productrices est au cœur des négociations.`,
    cover: "https://images.unsplash.com/photo-1761143518967-4f9f4f65a955?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Focus Niger",
    categorySlug: "focus-niger",
    tags: ["Niger", "Mines", "Uranium", "Pétrole", "Géopolitique"],
    publishedAt: "2026-02-22T14:00:00",
    readTime: 11,
    isPremium: false,
    featured: true,
    views: 15600,
    comments: 124,
  },
  {
    id: "art4",
    title: "Marché des cryptomonnaies en Afrique : adoption croissante malgré les régulations floues",
    slug: "cryptomonnaies-afrique-adoption-regulations",
    excerpt: "L'Afrique subsaharienne connaît une adoption accélérée des cryptomonnaies, portée par les transferts de fonds et la bancarisation alternative. Mais le cadre réglementaire reste fragmenté.",
    content: `L'Afrique est désormais l'une des régions à la croissance la plus rapide en matière d'adoption des cryptomonnaies. Cette tendance, portée par des besoins réels non couverts par le système bancaire traditionnel, interroge les régulateurs et les acteurs économiques.

**Facteurs d'adoption**

Plusieurs facteurs expliquent cette adoption rapide :
- Les coûts élevés des transferts de fonds internationaux traditionnels
- La faible bancarisation dans certains pays
- L'inflation et la dépréciation des monnaies locales
- La jeunesse de la population et son appétence technologique

**Paysage réglementaire fragmenté**

Alors que certains pays comme le Nigeria et le Kenya ont évolué vers une régulation progressive, d'autres maintiennent des interdictions totales. La BCEAO étudie actuellement un cadre commun pour les pays de l'UEMOA.`,
    cover: "https://images.unsplash.com/photo-1744473119469-905016183836?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Analyses de Marché",
    categorySlug: "analyses-de-marche",
    tags: ["Crypto", "Bitcoin", "Fintech", "Régulation", "Afrique"],
    publishedAt: "2026-02-21T09:00:00",
    readTime: 8,
    isPremium: true,
    views: 9800,
    comments: 56,
  },
  {
    id: "art5",
    title: "Agribusiness au Sahel : comment financer la transformation du secteur agricole ?",
    slug: "agribusiness-sahel-financement-transformation-agricole",
    excerpt: "Face aux défis alimentaires croissants, l'agribusiness au Sahel nécessite des investissements massifs. Tour d'horizon des mécanismes de financement disponibles et des opportunités pour les entrepreneurs.",
    content: `L'agriculture représente entre 30 et 40% du PIB des pays sahéliens et emploie la majorité de la population active. Pourtant, le secteur reste sous-financé et peu transformé. Comment combler ce fossé ?

**État des lieux**

La productivité agricole au Sahel reste bien en deçà de son potentiel. Les petits producteurs, qui constituent 90% des exploitants, n'ont accès qu'à un financement limité et à des technologies rudimentaires.

**Mécanismes de financement innovants**

Plusieurs approches prometteuses émergent :
- Le crédit-stockage (warrantage) qui permet aux agriculteurs d'emprunter sur la base de leur récolte stockée
- Les fonds d'investissement spécialisés dans l'agribusiness africain
- Les obligations vertes et climatiques pour financer l'agriculture durable
- Les plateformes de financement participatif agricole`,
    cover: "https://images.unsplash.com/photo-1758573644044-c30d09a8b06d?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Économie Africaine",
    categorySlug: "economie-africaine",
    tags: ["Agribusiness", "Agriculture", "Sahel", "Financement", "Développement"],
    publishedAt: "2026-02-20T11:30:00",
    readTime: 10,
    isPremium: false,
    views: 6700,
    comments: 38,
  },
  {
    id: "art6",
    title: "La Fed maintient ses taux : quelles conséquences pour les économies africaines ?",
    slug: "fed-taux-consequences-economies-africaines",
    excerpt: "La décision de la Réserve Fédérale américaine de maintenir ses taux inchangés a des répercussions directes sur les flux de capitaux vers les marchés émergents africains.",
    content: `La Réserve Fédérale américaine a décidé, lors de sa dernière réunion du FOMC, de maintenir ses taux directeurs dans la fourchette de 5,25-5,50%. Cette décision, bien que reflétant des préoccupations domestiques américaines, aura des impacts significatifs sur les économies africaines.

**Mécanismes de transmission**

Les canaux par lesquels la politique monétaire américaine affecte les économies africaines sont multiples :
- Les flux de capitaux vers les marchés émergents
- Le cours du dollar et l'endettement en devise étrangère
- Les prix des matières premières libellés en dollars

**Impact sur les dettes souveraines**

Plusieurs pays africains ont des dettes importantes libellées en dollars. Un dollar fort signifie une charge de remboursement plus lourde en monnaie locale.`,
    cover: "https://images.unsplash.com/photo-1579226905180-636b76d96082?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Économie Mondiale",
    categorySlug: "economie-mondiale",
    tags: ["Fed", "Taux", "Dollar", "Dette", "Marchés émergents"],
    publishedAt: "2026-02-19T08:00:00",
    readTime: 6,
    isPremium: false,
    views: 11200,
    comments: 72,
  },
  {
    id: "art7",
    title: "Rapport trimestriel : Performances des Bourses africaines — T4 2025",
    slug: "rapport-trimestriel-bourses-africaines-t4-2025",
    excerpt: "Notre analyse exclusive des performances des principales places boursières africaines au quatrième trimestre 2025, avec focus sur la BRVM, JSE, NGX et EGX.",
    content: `Le quatrième trimestre 2025 a été marqué par des performances contrastées sur les principales bourses africaines. Voici notre analyse complète.

**BRVM (Bourse Régionale des Valeurs Mobilières)**

L'indice BRVM Composite a progressé de 8,3% sur le trimestre, porté par les performances remarquables du secteur bancaire et des télécommunications. Sonatel et Ecobank ont été les principales locomotives de cette hausse.

**JSE (Johannesburg Stock Exchange)**

La JSE, principal marché boursier du continent, a affiché une progression de 5,7% en rand, mais cette performance doit être nuancée par la dépréciation de la devise sud-africaine face au dollar.

**Nigerian Exchange (NGX)**

Le NGX a enregistré sa meilleure performance trimestrielle depuis 2021 avec une hausse de 18% portée par les valeurs pétrolières et bancaires, dans un contexte de hausse du prix du pétrole et de stabilisation du naira.`,
    cover: "https://images.unsplash.com/photo-1765048892515-3bc3557dc980?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Analyses de Marché",
    categorySlug: "analyses-de-marche",
    tags: ["BRVM", "JSE", "Bourse", "Marchés financiers", "Rapport"],
    publishedAt: "2026-02-18T12:00:00",
    readTime: 15,
    isPremium: true,
    views: 7300,
    comments: 29,
  },
  {
    id: "art8",
    title: "Niamey sous tension : enjeux économiques de la transition politique au Niger",
    slug: "niamey-tension-enjeux-economiques-transition-politique",
    excerpt: "La capitale nigérienne traverse une période de profonde restructuration institutionnelle. Notre correspondant analyse les implications économiques pour les ménages et les entreprises.",
    content: `La transition politique en cours au Niger continue de peser sur l'économie du pays. Entre sanctions internationales partiellement levées et restructuration des partenariats, Niamey tente de tracer une nouvelle voie.

**Impact des sanctions sur l'économie réelle**

Les sanctions imposées par la CEDEAO, bien que partiellement levées, ont laissé des traces durables sur l'économie nigérienne. L'inflation a culminé à 12% en 2024 avant de redescendre progressivement.

**Résilience du secteur informel**

Le secteur informel, qui représente plus de 60% de l'économie nigérienne, a montré une remarquable capacité d'adaptation. Les circuits commerciaux transfrontaliers avec le Mali, le Burkina Faso et la Libye ont été réactivés.

**Perspectives pour 2026**

Les autorités nigériennes tablent sur une croissance de 6% en 2026, tirée par le secteur extractif et l'agriculture. Des projets d'infrastructure financés par des partenaires alternatifs sont en cours de déploiement.`,
    cover: "https://images.unsplash.com/photo-1735886161697-b868f22f7dcd?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Focus Niger",
    categorySlug: "focus-niger",
    tags: ["Niger", "Niamey", "Transition politique", "Économie", "CEDEAO"],
    publishedAt: "2026-02-17T15:00:00",
    readTime: 12,
    isPremium: false,
    views: 19800,
    comments: 201,
  },
  {
    id: "art9",
    title: "Éditorial : L'Afrique face au défi de l'industrialisation, des paroles aux actes",
    slug: "editorial-afrique-defi-industrialisation",
    excerpt: "Alors que les discours sur l'industrialisation africaine se multiplient dans les forums internationaux, les réalités sur le terrain révèlent un écart persistant entre ambitions et mise en œuvre.",
    content: `Lors des derniers sommets de l'Union Africaine, du G20 et de la COP, l'industrialisation du continent africain a été présentée comme une priorité absolue. Mais qu'en est-il réellement des avancées concrètes ?

**Le gap entre ambitions et réalités**

Malgré des engagements financiers répétés, la part de l'industrie manufacturière dans le PIB africain stagne autour de 11%, bien en dessous de l'objectif de 25% fixé dans l'Agenda 2063 de l'Union Africaine.

**Les freins structurels**

Plusieurs obstacles persistent :
- Le coût prohibitif de l'énergie dans de nombreux pays
- Les infrastructures logistiques insuffisantes
- La concurrence des importations asiatiques à bas prix
- Les difficultés d'accès au financement à long terme

**Notre proposition**

Une véritable politique industrielle africaine nécessite une cohérence entre politiques commerciales, éducatives et financières. La Zone de Libre-Échange Continentale Africaine (ZLECAf) offre un cadre prometteur, mais son potentiel reste largement sous-exploité.`,
    cover: "https://images.unsplash.com/photo-1765475467677-579353b25ce0?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Analyses de Marché",
    categorySlug: "analyses-de-marche",
    tags: ["Industrialisation", "Union Africaine", "ZLECAf", "Opinion", "Développement"],
    publishedAt: "2026-02-16T07:00:00",
    readTime: 5,
    isPremium: false,
    views: 14500,
    comments: 156,
  },
  {
    id: "art10",
    title: "Secteur énergétique au Niger : l'oléoduc Niger-Bénin, bilan et défis",
    slug: "niger-oleoduc-benin-bilan-defis",
    excerpt: "L'oléoduc Niger-Bénin, infrastructure stratégique pour l'exportation pétrolière nigérienne, fait face à des défis opérationnels et diplomatiques complexes.",
    content: `L'oléoduc Niger-Bénin, long de 2000 kilomètres, représente l'infrastructure pétrolière la plus importante jamais construite en Afrique de l'Ouest subsaharienne. Un an après son inauguration, quel bilan peut-on dresser ?

**Performances opérationnelles**

La capacité d'exportation actuelle se situe à environ 90 000 barils par jour, soit 75% de la capacité nominale. Des goulots d'étranglement logistiques au terminal de Sèmè-Kpodji (Bénin) ont limité les volumes exportés.

**Enjeux financiers**

Les recettes pétrolières représentent désormais une source significative de revenus pour l'État nigérien. Cependant, la volatilité des prix mondiaux du pétrole et la structure des contrats avec les opérateurs limitent les bénéfices nets pour le Trésor.

**Défis diplomatiques**

Les relations entre le Niger et le Bénin traversent une période de tensions. Des différends sur les droits de transit et les compensations pour les communautés traversées ont compliqué la gestion quotidienne de l'infrastructure.`,
    cover: "https://images.unsplash.com/photo-1765048892515-3bc3557dc980?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Focus Niger",
    categorySlug: "focus-niger",
    tags: ["Niger", "Pétrole", "Oléoduc", "Bénin", "Énergie"],
    publishedAt: "2026-02-15T09:30:00",
    readTime: 9,
    isPremium: true,
    views: 11400,
    comments: 88,
  },
  {
    id: "art11",
    title: "Finance islamique : la BCEAO prépare un cadre réglementaire pour l'UEMOA",
    slug: "finance-islamique-bceao-cadre-reglementaire-uemoa",
    excerpt: "La banque centrale de l'UEMOA travaille à l'élaboration d'un cadre juridique et réglementaire pour les banques et produits financiers islamiques dans la région.",
    content: `La finance islamique, longtemps marginale en Afrique de l'Ouest, connaît un essor remarquable. La BCEAO a lancé un processus de consultation pour définir un cadre réglementaire adapté.

**État du marché**

Plusieurs banques islamiques opèrent déjà dans la zone UEMOA, notamment au Sénégal, au Mali et au Niger. Leurs actifs combinés représentent environ 3% du total des actifs bancaires, avec une croissance annuelle de 15%.

**Les produits concernés**

Les produits financiers islamiques couverts par le futur cadre réglementaire incluent :
- La Mourabaha (financement d'achat avec marge bénéficiaire)
- L'Ijara (crédit-bail islamique)
- La Moucharaka (participation aux bénéfices et pertes)
- Les Sukuks (obligations islamiques)

**Enjeux pour l'inclusion financière**

La finance islamique peut contribuer significativement à l'inclusion financière dans une région où une large fraction de la population refuse les produits bancaires conventionnels pour des raisons religieuses.`,
    cover: "https://images.unsplash.com/photo-1742996111692-2d924f12a058?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Économie Africaine",
    categorySlug: "economie-africaine",
    tags: ["Finance islamique", "BCEAO", "UEMOA", "Régulation", "Inclusion financière"],
    publishedAt: "2026-02-14T11:00:00",
    readTime: 8,
    isPremium: true,
    views: 5600,
    comments: 34,
  },
  {
    id: "art12",
    title: "Rapport : Classement des meilleurs environnements d'investissement en Afrique 2026",
    slug: "rapport-classement-environnements-investissement-afrique-2026",
    excerpt: "Notre équipe d'analystes a évalué 30 pays africains selon 15 critères d'attractivité pour les investisseurs. Voici les résultats de ce classement exclusif.",
    content: `Pour la cinquième année consécutive, NFI REPORT publie son classement des meilleurs environnements d'investissement en Afrique. Cette édition 2026 couvre 30 pays évalués selon 15 critères.

**Méthodologie**

Notre classement repose sur l'analyse de 15 indicateurs regroupés en cinq catégories :
1. Cadre juridique et réglementaire
2. Infrastructure et logistique
3. Capital humain et éducation
4. Accès aux marchés financiers
5. Stabilité politique et sécurité

**Top 5 des destinations**

1. **Maurice** �� Cadre juridique exemplaire, hub financier régional
2. **Rwanda** — Réformes structurelles remarquables, excellence gouvernementale
3. **Maroc** — Hub industriel et financier panafricain
4. **Côte d'Ivoire** — Croissance soutenue, infrastructure en développement
5. **Kenya** — Écosystème technologique et financier dynamique`,
    cover: "https://images.unsplash.com/photo-1588623731810-171b80f3c55e?w=800&h=500&fit=crop",
    author: AUTHORS[0],
    category: "Analyses de Marché",
    categorySlug: "analyses-de-marche",
    tags: ["Investissement", "Classement", "Rapport", "Afrique", "Business"],
    publishedAt: "2026-02-13T08:00:00",
    readTime: 18,
    isPremium: true,
    views: 22100,
    comments: 189,
  },
];

// ============================================================
// CATEGORIES
// ============================================================
export const CATEGORIES = [
  { name: "Économie Africaine",  slug: "economie-africaine",  count: 89, icon: "" },
  { name: "Économie Mondiale",   slug: "economie-mondiale",   count: 67, icon: "" },
  { name: "Focus Niger",         slug: "focus-niger",         count: 45, icon: "" },
  { name: "Analyses de Marché",  slug: "analyses-de-marche",  count: 53, icon: "" },
];

// ============================================================
// COMMENTS
// ============================================================
export const COMMENTS: Comment[] = [
  {
    id: "c1",
    author: "Moussa Abdou",
    avatar: "https://images.unsplash.com/photo-1731093714827-ba0353e09bfb?w=50&h=50&fit=crop&crop=face",
    content: "Excellente analyse. La question des taux d'intérêt sur les PME est cruciale pour notre économie. Il faudrait aussi aborder les mécanismes de garantie mis en place par les États.",
    date: "2026-02-24T10:15:00",
    likes: 24,
  },
  {
    id: "c2",
    author: "Aminata Coulibaly",
    avatar: "https://images.unsplash.com/photo-1739300293504-234817eead52?w=50&h=50&fit=crop&crop=face",
    content: "Article très documenté. Je souhaiterais voir une comparaison avec les politiques monétaires d'autres banques centrales africaines (BEAC notamment).",
    date: "2026-02-23T15:30:00",
    likes: 18,
  },
  {
    id: "c3",
    author: "Seyni Maïga",
    avatar: "https://images.unsplash.com/photo-1742996111692-2d924f12a058?w=50&h=50&fit=crop&crop=face",
    content: "En tant qu'entrepreneur, je confirme que l'accès au crédit est notre principal obstacle. Les microfinances ne peuvent pas financer des projets d'envergure.",
    date: "2026-02-22T09:45:00",
    likes: 31,
  },
];

// ============================================================
// SUBSCRIPTION PLANS
// ============================================================
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Lecteur",
    price: 0,
    currency: "FCFA",
    period: "Gratuit",
    features: [
      "Accès aux articles gratuits",
      "3 articles premium par mois",
      "Newsletter hebdomadaire",
      "Alertes actualités majeures",
    ],
    highlighted: false,
  },
  {
    id: "standard",
    name: "Standard",
    price: 5000,
    currency: "FCFA",
    period: "/ mois",
    badge: "Populaire",
    features: [
      "Accès illimité aux articles",
      "Analyses et rapports complets",
      "Newsletter quotidienne",
      "Alertes personnalisées",
      "Archives complètes (5 ans)",
      "Mode hors-ligne (app mobile)",
    ],
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 10000,
    currency: "FCFA",
    period: "/ mois",
    badge: "Pro",
    features: [
      "Tout le plan Standard",
      "Rapports exclusifs PDF",
      "Accès aux webinaires mensuel",
      "Données financières en temps réel",
      "API pour intégration",
      "Support prioritaire 24h/7j",
      "Accès Early pour les analyses",
    ],
    highlighted: false,
  },
];

// ============================================================
// TEAM MEMBERS
// ============================================================
export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "t1",
    name: "Hassane Ibrahim",
    role: "Directeur Général",
    avatar: "https://images.unsplash.com/photo-1731093714827-ba0353e09bfb?w=300&h=300&fit=crop&crop=face",
    bio: "Fondateur de NFI REPORT, Hassane a plus de 20 ans d'expérience dans le journalisme économique et financier en Afrique.",
    linkedin: "#",
    twitter: "#",
  },
  {
    id: "t2",
    name: "Mariama Touré",
    role: "Directrice Éditoriale",
    avatar: "https://images.unsplash.com/photo-1739300293504-234817eead52?w=300&h=300&fit=crop&crop=face",
    bio: "Ancienne correspondante pour des médias internationaux, Mariama supervise la ligne éditoriale et garantit la rigueur journalistique de la rédaction.",
    linkedin: "#",
    twitter: "#",
  },
  {
    id: "t3",
    name: "Issoufou Garba",
    role: "Chef Analyste Financier",
    avatar: "https://images.unsplash.com/photo-1742996111692-2d924f12a058?w=300&h=300&fit=crop&crop=face",
    bio: "CFA charterholder, Issoufou dirige l'équipe d'analystes financiers et coordonne la production des rapports de marché.",
    linkedin: "#",
  },
  {
    id: "t4",
    name: "Roukayatou Moussa",
    role: "Responsable Développement",
    avatar: "https://images.unsplash.com/photo-1739300293504-234817eead52?w=300&h=300&fit=crop&crop=face",
    bio: "Spécialiste en stratégie média et développement commercial, Roukayatou gère les partenariats et la croissance de la plateforme.",
    linkedin: "#",
    twitter: "#",
  },
];

// ============================================================
// MARKET DATA
// ============================================================
export const MARKET_DATA = {
  indices: [
    { name: "BRVM Composite", value: 342.15, change: +2.3, percent: "+0.68%" },
    { name: "JSE All Share", value: 84210.5, change: -320.1, percent: "-0.38%" },
    { name: "NGX ASI", value: 104320.0, change: +1250, percent: "+1.21%" },
    { name: "EGX 30", value: 29840.3, change: +180.5, percent: "+0.61%" },
    { name: "NSE 20 (Kenya)", value: 1840.7, change: -12.4, percent: "-0.67%" },
  ],
  currencies: [
    { pair: "USD/FCFA", value: 604.25, change: -1.15 },
    { pair: "EUR/FCFA", value: 655.96, change: +0.42 },
    { pair: "USD/NGN", value: 1542.8, change: +8.3 },
    { pair: "USD/GHS", value: 15.62, change: -0.08 },
    { pair: "USD/KES", value: 128.45, change: +0.95 },
  ],
  commodities: [
    { name: "Pétrole Brent", value: 84.2, unit: "$/baril", change: +1.2 },
    { name: "Or", value: 2145.8, unit: "$/oz", change: -3.5 },
    { name: "Cacao", value: 9840, unit: "$/tonne", change: +120 },
    { name: "Uranium", value: 102.5, unit: "$/lb", change: +2.1 },
    { name: "Coton", value: 0.89, unit: "$/lb", change: -0.02 },
  ],
};

// Chart data for market analysis
export const CHART_DATA = {
  brvm: [
    { month: "Août", value: 315 },
    { month: "Sep", value: 322 },
    { month: "Oct", value: 318 },
    { month: "Nov", value: 329 },
    { month: "Déc", value: 335 },
    { month: "Jan", value: 338 },
    { month: "Fév", value: 342 },
  ],
  gdpGrowth: [
    { country: "Niger", value: 6.0 },
    { country: "Sénégal", value: 8.3 },
    { country: "Côte d'Ivoire", value: 6.9 },
    { country: "Mali", value: 3.2 },
    { country: "Burkina", value: 2.1 },
    { country: "Guinée", value: 4.8 },
  ],
  investment: [
    { year: "2020", china: 8.2, europe: 12.4, usa: 6.1, other: 4.3 },
    { year: "2021", china: 9.1, europe: 11.8, usa: 7.2, other: 5.1 },
    { year: "2022", china: 10.5, europe: 10.9, usa: 8.3, other: 6.2 },
    { year: "2023", china: 12.3, europe: 9.8, usa: 9.1, other: 7.8 },
    { year: "2024", china: 14.1, europe: 11.2, usa: 10.5, other: 8.9 },
    { year: "2025", china: 16.8, europe: 12.5, usa: 11.2, other: 9.4 },
  ],
};

// ============================================================
// TRENDING TAGS
// ============================================================
export const TRENDING_TAGS = [
  "UEMOA", "BCEAO", "Niger", "Pétrole", "Crypto", "ZLECAf",
  "FMI", "Bourse", "Agriculture", "Mining", "Sahel", "Finance islamique",
  "Investissement", "Dollar", "IMF", "Inflation",
];

// ============================================================
// SAVED ARTICLES (pour le profil utilisateur)
// ============================================================
export const SAVED_ARTICLES = [ARTICLES[0], ARTICLES[2], ARTICLES[6]];

// ============================================================
// USER PROFILE (mock)
// ============================================================
export const MOCK_USER = {
  id: "u1",
  name: "Oumarou Sanda",
  email: "oumarou.sanda@example.com",
  avatar: "https://images.unsplash.com/photo-1731093714827-ba0353e09bfb?w=100&h=100&fit=crop&crop=face",
  subscription: "Standard",
  subscriptionExpiry: "2026-12-31",
  joinedAt: "2024-03-15",
  savedArticles: SAVED_ARTICLES,
  readArticles: 47,
};

// Helper
export function getArticlesByCategory(slug: string): Article[] {
  return ARTICLES.filter((a) => a.categorySlug === slug);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getFeaturedArticles(): Article[] {
  return ARTICLES.filter((a) => a.featured);
}

export function getRelatedArticles(article: Article, limit = 4): Article[] {
  return ARTICLES.filter(
    (a) => a.id !== article.id && a.categorySlug === article.categorySlug
  ).slice(0, limit);
}

export function searchArticles(query: string): Article[] {
  const q = query.toLowerCase();
  return ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.category.toLowerCase().includes(q)
  );
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR").format(price);
}