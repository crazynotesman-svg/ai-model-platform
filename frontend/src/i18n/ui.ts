/**
 * UI 文案字典（7 语言）。
 *
 * - 所有语言的键必须完全一致：通过 `satisfies` 约束在编译期校验；
 * - 键按模块/页面分组命名（site.* / nav.* / home.* / footer.*），后续业务模块按相同约定扩展；
 * - 文案遵循 i18n 最佳实践：数量/日期等占位符后续使用 ICU 风格消息或库统一处理（Phase 2+）。
 */
import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales';

const ui = {
  en: {
    'site.title': 'AI Model Intelligence Platform',
    'site.tagline':
      'Free, open, global AI model intelligence — models, pricing, tokens, costs, and news.',
    'nav.models': 'Models',
    'nav.compare': 'Compare',
    'nav.tokenCounter': 'Token Counter',
    'nav.costEstimator': 'Cost Estimator',
    'nav.news': 'News',
    'home.welcome': 'Welcome to the AI Model Intelligence Platform',
    'home.placeholder':
      'Platform foundation is ready. Model lookup, pricing comparison, token counting, cost estimation, and news will be enabled in upcoming phases.',
    'footer.builtFree': 'Free · Open · Global · Transparent data',
    'footer.rights': 'All rights reserved.',
  },
  'zh-CN': {
    'site.title': 'AI 模型情报平台',
    'site.tagline': '免费、开放、全球化的 AI 模型情报 — 模型、价格、Token、成本与资讯。',
    'nav.models': '模型',
    'nav.compare': '对比',
    'nav.tokenCounter': 'Token 计数',
    'nav.costEstimator': '成本估算',
    'nav.news': '资讯',
    'home.welcome': '欢迎来到 AI 模型情报平台',
    'home.placeholder':
      '平台基础架构已就绪。模型查询、价格对比、Token 计数、成本估算与行业资讯将在后续阶段陆续开放。',
    'footer.builtFree': '免费 · 开放 · 全球化 · 数据透明',
    'footer.rights': '保留所有权利。',
  },
  ja: {
    'site.title': 'AIモデル情報プラットフォーム',
    'site.tagline':
      '無料・オープン・グローバルなAIモデル情報 — モデル、価格、トークン、コスト、ニュース。',
    'nav.models': 'モデル',
    'nav.compare': '比較',
    'nav.tokenCounter': 'トークン計算',
    'nav.costEstimator': 'コスト見積り',
    'nav.news': 'ニュース',
    'home.welcome': 'AIモデル情報プラットフォームへようこそ',
    'home.placeholder':
      'プラットフォーム基盤は準備完了です。モデル検索、価格比較、トークン計算、コスト見積り、ニュースは今後のフェーズで有効化されます。',
    'footer.builtFree': '無料・オープン・グローバル・透明なデータ',
    'footer.rights': 'All rights reserved.',
  },
  ko: {
    'site.title': 'AI 모델 인텔리전스 플랫폼',
    'site.tagline':
      '무료·개방·글로벌 AI 모델 인텔리전스 — 모델, 가격, 토큰, 비용, 뉴스.',
    'nav.models': '모델',
    'nav.compare': '비교',
    'nav.tokenCounter': '토큰 계산기',
    'nav.costEstimator': '비용 추정',
    'nav.news': '뉴스',
    'home.welcome': 'AI 모델 인텔리전스 플랫폼에 오신 것을 환영합니다',
    'home.placeholder':
      '플랫폼 기반이 준비되었습니다. 모델 조회, 가격 비교, 토큰 계산, 비용 추정, 뉴스는 이후 단계에서 제공됩니다.',
    'footer.builtFree': '무료 · 개방 · 글로벌 · 투명한 데이터',
    'footer.rights': 'All rights reserved.',
  },
  es: {
    'site.title': 'Plataforma de Inteligencia de Modelos de IA',
    'site.tagline':
      'Inteligencia de modelos de IA gratuita, abierta y global: modelos, precios, tokens, costos y noticias.',
    'nav.models': 'Modelos',
    'nav.compare': 'Comparar',
    'nav.tokenCounter': 'Contador de tokens',
    'nav.costEstimator': 'Estimador de costos',
    'nav.news': 'Noticias',
    'home.welcome': 'Bienvenido a la Plataforma de Inteligencia de Modelos de IA',
    'home.placeholder':
      'La base de la plataforma está lista. La consulta de modelos, comparación de precios, conteo de tokens, estimación de costos y noticias se habilitarán en próximas fases.',
    'footer.builtFree': 'Gratis · Abierto · Global · Datos transparentes',
    'footer.rights': 'Todos los derechos reservados.',
  },
  de: {
    'site.title': 'AI-Modell-Intelligence-Plattform',
    'site.tagline':
      'Kostenlos, offen, global: KI-Modellinformationen zu Modellen, Preisen, Tokens, Kosten und News.',
    'nav.models': 'Modelle',
    'nav.compare': 'Vergleichen',
    'nav.tokenCounter': 'Token-Zähler',
    'nav.costEstimator': 'Kostenrechner',
    'nav.news': 'News',
    'home.welcome': 'Willkommen auf der AI-Modell-Intelligence-Plattform',
    'home.placeholder':
      'Die Plattform-Grundlage ist bereit. Modellsuche, Preisvergleich, Token-Zählung, Kostenberechnung und News folgen in kommenden Phasen.',
    'footer.builtFree': 'Kostenlos · Offen · Global · Transparente Daten',
    'footer.rights': 'Alle Rechte vorbehalten.',
  },
  fr: {
    'site.title': 'Plateforme d\'intelligence des modèles IA',
    'site.tagline':
      'Intelligence des modèles d\'IA gratuite, ouverte et mondiale — modèles, tarifs, tokens, coûts et actualités.',
    'nav.models': 'Modèles',
    'nav.compare': 'Comparer',
    'nav.tokenCounter': 'Compteur de tokens',
    'nav.costEstimator': 'Estimateur de coûts',
    'nav.news': 'Actualités',
    'home.welcome': 'Bienvenue sur la Plateforme d\'intelligence des modèles IA',
    'home.placeholder':
      'Les fondations de la plateforme sont prêtes. La recherche de modèles, la comparaison des prix, le comptage de tokens, l\'estimation des coûts et les actualités seront activés dans les prochaines phases.',
    'footer.builtFree': 'Gratuit · Ouvert · Mondial · Données transparentes',
    'footer.rights': 'Tous droits réservés.',
  },
} satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)[typeof DEFAULT_LOCALE];

/** 从 URL 解析语言代码；无法识别时回退默认语言 */
export function getLangFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split('/');
  if (lang && (LOCALES as readonly string[]).includes(lang)) {
    return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

/** 返回指定语言的翻译函数；缺失键回退默认语言 */
export function useTranslations(lang: Locale) {
  return (key: UiKey) => ui[lang][key] ?? ui[DEFAULT_LOCALE][key];
}
