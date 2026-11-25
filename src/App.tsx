import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Settings,
  Play,
  CheckCircle2,
  XCircle,
  Star,
  AlertTriangle,
  BarChart3,
  Clock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Stethoscope,
  Microscope,
  FileText,
  Trash2,
  Award,
  Layers,
  Filter,
  Check,
  Info,
  X,
  Compass,
  BookmarkCheck,
  Wifi,
  Loader2,
  KeyRound,
  ExternalLink,
  Copy,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Smartphone,
  Share,
  PlusSquare,
  Menu,
  ImagePlus,
  ZoomIn,
  Camera
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share as CapacitorShare } from '@capacitor/share';

// ============================================================================
// 1. VERİ MODELLERİ VE SABİTLER (TEXTBOOK EŞLEŞTİRME MOTORU)
// ============================================================================

type CategoryType = 'Klinik Bilimler' | 'Temel Bilimler';
type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';
type QuestionOptions = Record<OptionKey, string>;

interface SubjectInfo {
  id: string;
  name: string;
  category: CategoryType;
  textbooks: string;
}

const SUBJECTS: SubjectInfo[] = [
  // Temel Bilimler (6 Ders)
  {
    id: 'anatomi',
    name: 'Anatomi',
    category: 'Temel Bilimler',
    textbooks: 'Sobotta Atlas of Human Anatomy, Gray’s Anatomy, Snell Klinik Anatomi'
  },
  {
    id: 'fizyoloji_histoloji',
    name: 'Fizyoloji, Histoloji ve Embriyoloji',
    category: 'Temel Bilimler',
    textbooks: 'Guyton ve Hall Tıbbi Fizyoloji, Ten Cate’s Oral Histology, Junqueira Temel Histoloji'
  },
  {
    id: 'biyokimya',
    name: 'Tıbbi Biyokimya',
    category: 'Temel Bilimler',
    textbooks: 'Harper’s Illustrated Biochemistry, Lippincott Illustrated Reviews: Biochemistry'
  },
  {
    id: 'mikrobiyoloji',
    name: 'Tıbbi Mikrobiyoloji',
    category: 'Temel Bilimler',
    textbooks: 'Murray Medical Microbiology, Jawetz Melnick & Adelberg’s Medical Microbiology'
  },
  {
    id: 'patoloji',
    name: 'Tıbbi Patoloji',
    category: 'Temel Bilimler',
    textbooks: 'Robbins & Cotran Pathologic Basis of Disease, Neville Oral and Maxillofacial Pathology'
  },
  {
    id: 'farmakoloji_genetik',
    name: 'Tıbbi Farmakoloji ve Tıbbi Biyoloji-Genetik',
    category: 'Temel Bilimler',
    textbooks: 'Katzung Basic & Clinical Pharmacology, Goodman & Gilman, Thompson & Thompson Genetics in Medicine'
  },

  // Klinik Bilimler (8 Ders)
  {
    id: 'protetik',
    name: 'Protetik Diş Tedavisi',
    category: 'Klinik Bilimler',
    textbooks: 'Shillingburg (Sabit Protez), McCracken (Hareketli Bölümlü Protez), Zarb & Boucher (Tam Protez), Okeson (Oklüzyon ve TME)'
  },
  {
    id: 'restoratif',
    name: 'Restoratif Diş Tedavisi',
    category: 'Klinik Bilimler',
    textbooks: 'Sturdevant’s Art and Science of Operative Dentistry, Summit’s Fundamentals of Operative Dentistry'
  },
  {
    id: 'cerrahi',
    name: 'Ağız, Diş ve Çene Cerrahisi',
    category: 'Klinik Bilimler',
    textbooks: 'Peterson’s Contemporary Oral and Maxillofacial Surgery, Fonseca Oral and Maxillofacial Surgery'
  },
  {
    id: 'radyoloji',
    name: 'Ağız, Diş ve Çene Radyolojisi',
    category: 'Klinik Bilimler',
    textbooks: 'White and Pharoah’s Oral Radiology: Principles and Interpretation'
  },
  {
    id: 'periodontoloji',
    name: 'Periodontoloji',
    category: 'Klinik Bilimler',
    textbooks: 'Newman and Carranza’s Clinical Periodontology'
  },
  {
    id: 'endodonti',
    name: 'Endodonti',
    category: 'Klinik Bilimler',
    textbooks: 'Cohen’s Pathways of the Pulp, Ingle’s Endodontics'
  },
  {
    id: 'pedodonti',
    name: 'Pedodonti (Çocuk Diş Hekimliği)',
    category: 'Klinik Bilimler',
    textbooks: 'McDonald and Avery’s Dentistry for the Child and Adolescent'
  },
  {
    id: 'ortodonti',
    name: 'Ortodonti',
    category: 'Klinik Bilimler',
    textbooks: 'Proffit’s Contemporary Orthodontics'
  }
];

const QUICK_SUBTOPICS: Record<string, string[]> = {
  protetik: [
    'Oklüzyon ve TME (Okeson)',
    'Sabit Protez ve Preparasyon (Shillingburg)',
    'Hareketli Bölümlü Protez ve Kennedy (McCracken)',
    'Tam Protez ve Ölçü/Dikey Boyut (Zarb & Boucher)',
    'Dental Seramikler ve Simantasyon'
  ],
  restoratif: [
    'Adeziv Sistemler ve Dentin Bağlanması',
    'Kompozit Rezinler ve Polimerizasyon',
    'Çürük Mikrobiyolojisi ve Remineralizasyon',
    'Kavite Prensipleri (Black) ve Amalgam'
  ],
  endodonti: [
    'Kök Kanal İrrigasyon Solüsyonları ve Şelasyon',
    'Pulpa ve Periapikal Hastalıklar Sınıflaması',
    'Kök Kanal Anatomisi ve Çalışma Boyutu',
    'Endodontik Aciller ve Dental Travmatoloji'
  ],
  periodontoloji: [
    '2017 Periodontal Hastalıklar Sınıflaması',
    'Periodontal Cerrahi ve Flep Operasyonları',
    'Kemik İçi Defektler ve Rejeneratif Tedavi (GTR)',
    'Peri-implant Hastalıklar ve Mukogingival Cerrahi'
  ],
  cerrahi: [
    'Gömülü Yirmi Yaş Dişleri ve Sınıflamaları',
    'Lokal Anestezi Teknikleri ve Komplikasyonları',
    'Odontojenik Kistler ve Tümörler',
    'Maksillofasiyal Travma ve Kırıklar (Le Fort)'
  ],
  radyoloji: [
    'Radyasyon Fiziği ve Dozimetri',
    'Konik Işınlı Bilgisayarlı Tomografi (CBCT)',
    'Çene Kemiklerinin Radyolüsent/Radyoopak Lezyonları',
    'Projeksiyon Geometrisi ve SLOB Kuralı'
  ],
  ortodonti: [
    'Sefalometrik Analiz Noktaları ve Açıları',
    'Büyüme ve Gelişim Teorileri',
    'Angle Maloklüzyon Sınıflaması ve Tedavisi',
    'Ortopedik ve Fonksiyonel Apareyler'
  ],
  pedodonti: [
    'Süt Dişlerinde Pulpa Tedavileri (Amputasyon/Kanal)',
    'Yer Tutucular ve Erken Süt Dişi Kaybı',
    'Çocuklarda Dental Travma Yönetimi',
    'Florür Uygulamaları ve Fissür Örtücüler'
  ],
  pedodonti_ortodonti: [
    'Süt Dişlerinde Pulpa Tedavileri (Amputasyon/Kanal)',
    'Yer Tutucular ve Erken Süt Dişi Kaybı',
    'Sefalometrik Analiz Noktaları ve Açıları',
    'Angle Maloklüzyon Sınıflaması ve Tedavisi',
    'Çocuklarda Dental Travma ve Büyüme-Gelişim'
  ],
  anatomi: [
    'Nervus Trigeminus (V) ve Dalları',
    'Nervus Facialis (VII) Seyri ve Dalları',
    'Çiğneme Kasları ve Fossa Infratemporalis',
    'Baş-Boyun Arterleri ve Venöz Drenajı'
  ],
  fizyoloji_histoloji: [
    'Aksiyon Potansiyeli ve Sinaptik İleti',
    'Ağrı Fizyolojisi ve Trigeminal Nosisepsiyon',
    'Mine ve Dentin Histolojisi (Amelogenez/Dentinogenez)',
    'Pulpa, Periodontal Ligament ve Brankiyal Arkuslar'
  ],
  biyokimya: [
    'Enzim Kinetiği ve İnhibisyon Mekanizmaları',
    'Karbonhidrat Metabolizması (Glikoliz / Krebs)',
    'Kollajen Sentezi ve Ekstraselüler Matriks',
    'Vitaminler ve Koenzimler'
  ],
  mikrobiyoloji: [
    'Oral Mikrobiyota ve Dental Plak Biyofilmi',
    'Karyojenik ve Periodontopatojen Bakteriler',
    'Sterilizasyon, Dezenfeksiyon ve Enfeksiyon Kontrolü',
    'Oral Viral ve Fungal Enfeksiyonlar (Candida / HSV)'
  ],
  patoloji: [
    'İltihap ve Yara İyileşmesi Mekanizmaları',
    'Oral Mukozanın Premalign Lezyonları ve SCC',
    'Tükürük Bezi Tümörleri',
    'Odontojenik Kist ve Tümör Patolojisi'
  ],
  farmakoloji_genetik: [
    'Lokal Anesteziklerin Farmakolojisi ve Maksimum Dozlar',
    'Diş Hekimliğinde Antibiyotikler ve Profilaksi',
    'Analjezikler (NSAİİ ve Opioidler)',
    'Mendel Kalıtım Modelleri ve Kraniofasiyal Sendromlar'
  ]
};

/**
 * Seçilen ders ve alt konuya göre ilgili textbook'u öne çıkaran akıllı eşleştirici.
 */
function resolveFocusedTextbooks(subject: SubjectInfo, subtopic: string): string {
  const lower = subtopic.toLowerCase();
  if (subject.id === 'protetik') {
    if (
      lower.includes('oklüzyon') ||
      lower.includes('okluzyon') ||
      lower.includes('tme') ||
      lower.includes('temporomandibular') ||
      lower.includes('sentrik') ||
      lower.includes('splint') ||
      lower.includes('artikülatör') ||
      lower.includes('çiğneme')
    ) {
      return 'BİRİNCİL ZORUNLU KAYNAK: Okeson (Management of Temporomandibular Disorders and Occlusion) — Sabit, hareketli veya tam protez konularına KESİNLİKLE girme!';
    }
    if (lower.includes('sabit') || lower.includes('kron') || lower.includes('köprü') || lower.includes('preparasyon') || lower.includes('post')) {
      return 'BİRİNCİL ZORUNLU KAYNAK: Shillingburg (Fundamentals of Fixed Prosthodontics) — Diğer protez alt dallarına kayma!';
    }
    if (lower.includes('hareketli') || lower.includes('bölümlü') || lower.includes('kennedy') || lower.includes('kroşe') || lower.includes('ana bağlayıcı')) {
      return 'BİRİNCİL ZORUNLU KAYNAK: McCracken (Removable Partial Prosthodontics) — Diğer protez alt dallarına kayma!';
    }
    if (lower.includes('tam protez') || lower.includes('total') || lower.includes('dikey boyut') || lower.includes('post-dam')) {
      return 'BİRİNCİL ZORUNLU KAYNAK: Zarb & Boucher (Prosthodontic Treatment for Edentulous Patients) — Diğer protez alt dallarına kayma!';
    }
  }
  return subject.textbooks;
}

interface DistractorExplanations {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
}

interface AuditResult {
  isVerified: boolean;
  confidenceScore: number;
  verdictTitle: string;
  detailedReview: string;
  editionNotes: string;
  checkedAt: string;
}

interface DUSQuestion {
  id: string;
  subjectId: string;
  subject: string;
  category: CategoryType;
  subtopic?: string;
  questionType: string;
  difficulty: string;
  stem: string;
  premises?: string[];
  imageUrl?: string; // Base64 veya URL görsel (radyografi, klinik fotoğraf, histolojik kesit vb.)
  imageCaption?: string; // Görsel altı klinik/radyografik açıklama etiketi
  options: QuestionOptions;
  correctAnswer: OptionKey;
  textbookReference: string;
  mechanismExplanation: string;
  distractorExplanations: DistractorExplanations;
  createdAt: string;
  // Kullanıcı etkileşim alanları
  isFavorite?: boolean;
  isWrongPreviously?: boolean;
  lastUserAnswer?: OptionKey;
  attemptsCount?: number;
  correctCount?: number;
  auditResult?: AuditResult;
  // Aralıklı tekrar (Yanlışlar defteri)
  reviewStage?: number; // kaç vadeli tekrar doğru geçildi (0-4)
  nextReviewAt?: string; // bir sonraki tekrarın ISO tarihi
}

interface ExamAttemptSession {
  questions: DUSQuestion[];
  userAnswers: Record<string, OptionKey>;
  eliminatedOptions: Record<string, OptionKey[]>;
  mode: 'study' | 'exam';
  isSubmitted: boolean;
  startedAt: number;
  timerMode: 'stopwatch' | 'countdown' | 'untimed';
  initialDurationSec: number;
}

// ============================================================================
// 2. ÖRNEK KANONİK DUS SORULARI (BAŞLANGIÇ DENEYİMİ İÇİN)
// ============================================================================

const SAMPLE_QUESTIONS: DUSQuestion[] = [
  {
    id: 'sample-dus-klinik-1',
    subjectId: 'protetik',
    subject: 'Protetik Diş Tedavisi',
    category: 'Klinik Bilimler',
    subtopic: 'Temporomandibular Düzensizlikler',
    questionType: 'Klinik Vaka Senaryosu',
    difficulty: 'Seçici (Eleyici) DUS',
    stem: '52 yaşındaki erkek hasta, sabah uyandığında özellikle sağ şakak ve yanak bölgesinde künt bir ağrı ve çene hareketlerinde kısıtlılık şikayetiyle başvuruyor. Klinik muayenede maksimum aktif ağız açıklığı 32 mm ölçülüyor ancak hekim nazik pasif germe (passive stretch) uyguladığında ağız açıklığı 43 mm’ye ulaşıyor ve bu esnada ağrı artıyor. Eklem sesleri (klik veya krepitasyon) alınmıyor ve panoramik radyografide kondil morfolojisi normal izleniyor.\n\nOkeson’un temporomandibular düzensizlikler sınıflamasına göre bu hastada en olası tanı ve ilk basamak tedavi yaklaşımı aşağıdakilerden hangisidir?',
    premises: [],
    options: {
      A: 'Redüksiyonsuz disk deplasmanı – Anterior repozisyonlama splinti',
      B: 'Lokal kas ağrısı (Miyospazm dışı) – Stabilizasyon splinti ve yumuşak diyet',
      C: 'Fibröz ankiloz – Artrosentez ve zorlu çene açma egzersizleri',
      D: 'Retrodiskit – Posterior ısırma plağı ve kortikosteroid enjeksiyonu',
      E: 'Redüksiyonlu disk deplasmanı – Kanin koruyuculu oklüzal aşındırma'
    },
    correctAnswer: 'B',
    textbookReference: 'Okeson JP. Management of Temporomandibular Disorders and Occlusion, 8th Ed., Bölüm 10 & 12.',
    mechanismExplanation:
      'Kas kaynaklı ağız açıklığı kısıtlılıklarında aktif açma ağrı nedeniyle kısıtlıdır (<40 mm), ancak hekim tarafından uygulanan nazik pasif germe (passive stretch) ile kas boyu uzatılarak açıklık 40 mm üzerine çıkarılabilir ("yumuşak sonlanım / soft end-feel"). Eklem içi mekanik engellerde ise pasif germeye rağmen açıklık artmaz ("sert sonlanım / hard end-feel"). İlk basamak tedavi geri dönüşümlü ve konservatif yaklaşımlar olan stabilizasyon (sentrik ilişki) splinti, yumuşak diyet ve fizik tedavidir.',
    distractorExplanations: {
      A: 'Redüksiyonsuz disk deplasmanında pasif germe ile ağız açıklığı 40 mm üzerine çıkmaz (hard end-feel) ve anamnezde aniden kesilen klik sesi öyküsü bulunur.',
      B: 'Doğru seçenektir.',
      C: 'Fibröz veya kemik ankilozda pasif germeye kesinlikle yanıt vermeyen ileri derecede ağız açıklığı kısıtlılığı ve radyografik eklem aralığı kaybı görülür.',
      D: 'Retrodiskitte posterior dişlerin temasıyla artan akut eklem içi ağrı ve etkilenen tarafta posterior açık kapanış (akut maloklüzyon) izlenir.',
      E: 'Redüksiyonlu disk deplasmanında açma ve kapama sırasında karakteristik resiprokal klik sesi mevcuttur ve ağız açıklığı genellikle kısıtlı değildir.'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-dus-klinik-2',
    subjectId: 'endodonti',
    subject: 'Endodonti',
    category: 'Klinik Bilimler',
    subtopic: 'Kök Kanal İrrigasyonu',
    questionType: 'Öncüllü Soru (I, II, III)',
    difficulty: 'Standart DUS',
    stem: 'Kök kanal tedavisi sırasında kullanılan irrigasyon solüsyonları ve şelasyon ajanlarının kimyasal etkileşimleri ile klinik etkileri hakkında yukarıdaki ifadelerden hangileri doğrudur?',
    premises: [
      'I. Sodyum hipoklorit (NaOCl) ile klorheksidin (CHX) doğrudan karıştırıldığında parakloroanilin (PCA) içeren turuncu-kahverengi bir çökelti oluşur.',
      'II. EDTA, smear tabakasının hem organik hem de inorganik bileşenlerini tek başına tamamen uzaklaştırabilir.',
      'III. Sodyum hipoklorit ile EDTA aynı anda karıştırıldığında NaOCl’nin serbest klor miktarı azalır ve doku çözücü etkinliği düşer.'
    ],
    options: {
      A: 'Yalnız I',
      B: 'Yalnız II',
      C: 'I ve II',
      D: 'I ve III',
      E: 'I, II ve III'
    },
    correctAnswer: 'D',
    textbookReference: 'Cohen’s Pathways of the Pulp, 12th Ed., Bölüm 6 (Cleaning and Shaping of the Root Canal System).',
    mechanismExplanation:
      'NaOCl ve CHX arasındaki asit-baz reaksiyonu sonucu sitotoksik ve kanserojen potansiyeli olan parakloroanilin (PCA) çökeltisi meydana gelir; bu nedenle iki solüsyon arasında mutlaka serum fizyolojik veya distile su ile ara yıkama yapılmalıdır (I doğru). Ayrıca EDTA, NaOCl ile karıştırıldığında serbest kullanılabilir kloru hızla tüketerek NaOCl’nin nekrotik doku çözücü ve antibakteriyel kapasitesini baskılar (III doğru).',
    distractorExplanations: {
      A: 'III. öncül de doğrudur; EDTA ve NaOCl eşzamanlı karıştırılmamalı, ardışık protokolle uygulanmalıdır.',
      B: 'II. öncül yanlıştır; EDTA yalnızca smear tabakasının inorganik (kalsiyum) kısmını şelasyonla çözer. Organik kısmın çözülmesi için NaOCl gereklidir.',
      C: 'II. öncül yanlış olduğu için bu seçenek doğru değildir.',
      D: 'Doğru seçenektir.',
      E: 'II. öncül hatalı bilgi içerdiğinden tüm öncüller doğru kabul edilemez.'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-dus-temel-1',
    subjectId: 'anatomi',
    subject: 'Anatomi',
    category: 'Temel Bilimler',
    subtopic: 'Nervus Mandibularis (V3) Dalları',
    questionType: 'Spot / Sınıflandırma & Kural',
    difficulty: 'Seçici (Eleyici) DUS',
    stem: 'Fossa infratemporalis bölgesinde seyreden nervus mandibularis’in (V3) dalları ve bu dalların innervasyon alanları ile ilgili aşağıdaki eşleştirmelerden hangisi yanlıştır?',
    premises: [],
    options: {
      A: 'Nervus auriculotemporalis – Glandula parotidea’ya parasempatik postganglionik liflerin taşınması',
      B: 'Nervus lingualis – Dilin 2/3 ön kısmının genel somatik duyusu',
      C: 'Nervus alveolaris inferior – Musculus mylohyoideus ve venter anterior musculi digastrici’nin motor innervasyonu',
      D: 'Nervus buccalis – Musculus buccinator’un motor innervasyonu',
      E: 'Nervus pterygoideus medialis – Musculus tensor veli palatini ve musculus tensor tympani’nin motor innervasyonu'
    },
    correctAnswer: 'D',
    textbookReference: 'Gray’s Anatomy for Students & Snell Klinik Anatomi (Baş ve Boyun Anatomisi - Fossa Infratemporalis).',
    mechanismExplanation:
      'Nervus buccalis, n. mandibularis’in ön (anterior) divizyonundan çıkan tamamen DUYUSAL bir daldır; yanak mukozası ve alt molar dişlerin bukkal diş etinin genel duyusunu taşır. Musculus buccinator’un motor innervasyonu ise nervus facialis’in (VII) ramus buccalis dalı tarafından sağlanır.',
    distractorExplanations: {
      A: 'Doğru bilgidir: Ganglion oticum’dan çıkan postganglionik parasempatik sekretomotor lifler n. auriculotemporalis aracılığıyla parotis bezine ulaşır.',
      B: 'Doğru bilgidir: N. lingualis dilin 2/3 ön kısmının genel somatik duyusunu (ağrı, ısı, dokunma) alır; tat duyusu ise chorda tympani ile taşınır.',
      C: 'Doğru bilgidir: N. alveolaris inferior foramen mandibulae’ye girmeden hemen önce n. mylohyoideus dalını verir ve bu dal m. mylohyoideus ile digastrik kasın ön karnını uyarır.',
      D: 'Doğru seçenektir (Yanlış eşleştirme budur).',
      E: 'Doğru bilgidir: N. pterygoideus medialis dalı hem m. pterygoideus medialis’i hem de ganglion oticum’dan sinaps yapmadan geçerek m. tensor veli palatini ve m. tensor tympani’yi innerve eder.'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-dus-temel-2',
    subjectId: 'farmakoloji',
    subject: 'Tıbbi Farmakoloji',
    category: 'Temel Bilimler',
    subtopic: 'Lokal Anestezikler',
    questionType: 'Klinik Vaka Senaryosu',
    difficulty: 'Standart DUS',
    stem: 'Diş hekimliği pratiğinde sık kullanılan amid grubu bir lokal anestezik olan artikain ile ilgili aşağıdaki ifadelerden hangisi Katzung ve Goodman & Gilman farmakoloji prensipleri açısından doğrudur?',
    premises: [],
    options: {
      A: 'Yapısında benzen halkası yerine tiyofen halkası ve ek bir ester bağı taşıdığından hem plazma esterazları hem karaciğerde metabolize edilir.',
      B: 'Eliminasyon yarı ömrü bupivakainden yaklaşık 4 kat daha uzun olduğu için uzun süreli cerrahi işlemlerde tercih edilir.',
      C: 'Ester grubu bir lokal anestezik olduğu için para-aminobenzoik asit (PABA) metaboliti oluşturur ve alerji riski yüksektir.',
      D: 'Vasodilatör etkisi diğer tüm lokal anesteziklerden daha güçlü olduğundan vazokonstriktörsüz %4’lük formu en uzun pulpal anesteziyi sağlar.',
      E: 'Sadece karaciğer mikrozomal enzimleriyle yıkıldığı için şiddetli karaciğer yetmezliğinde kesin kontrendikedir.'
    },
    correctAnswer: 'A',
    textbookReference: 'Katzung Basic & Clinical Pharmacology & Goodman & Gilman (Local Anesthetics).',
    mechanismExplanation:
      'Artikain, amid sınıfı bir lokal anestezik olmasına rağmen aromatik halka olarak benzen yerine tiyofen halkası içerir ve molekülünde ek bir ester yan zinciri bulunur. Bu ester bağı sayesinde plazmadaki non-spesifik plazma esterazları tarafından hızla inaktif artikainik aside hidrolize edilir; bu da eliminasyon yarı ömrünü (~20-27 dk) diğer amidlere göre oldukça kısaltır ve sistemik toksisite birikim riskini azaltır.',
    distractorExplanations: {
      A: 'Doğru seçenektir.',
      B: 'Artikainin plazma yarı ömrü yaklaşık 20-27 dakika ile oldukça kısadır; bupivakain ise uzun etkili bir lokal anesteziktir (yarı ömrü ~2.7 saat).',
      C: 'Artikain amid grubu bir anesteziktir ve PABA metabolitine dönüşmez.',
      D: 'Vazokonstriktörsüz (adrenalinsiz) %4 artikain yalnızca kısa süreli infiltrasyon anestezisi sağlar; uzun pulpal anestezi için epinefrin (1:100.000 veya 1:200.000) ile kombine edilir.',
      E: 'Büyük oranda (%90) plazma esterazları ile kanda hidrolize edildiği için hepatik klirens bağımlılığı lidokain veya mepivakaine kıyasla daha düşüktür.'
    },
    createdAt: new Date().toISOString()
  }
];

// ============================================================================
// 3. GÜVENLİ JSON AYRIŞTIRICI VE GEMINI API İSTEMCİ FONKSİYONLARI
// ============================================================================

const STORAGE_KEYS = {
  API_KEY: 'dus_gemini_api_key',
  MODEL: 'dus_gemini_model',
  BANK: 'dus_question_bank_v2',
  THEME: 'dus_theme_v1'
};

function formatTime(seconds: number): string {
  const absSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(absSec / 60);
  const secs = absSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Yüklenen görselleri (radyografi, klinik fotoğraf, histolojik preparat vb.)
 * localStorage kotasını doldurmayacak şekilde istemci tarafında yeniden boyutlandırır ve sıkıştırır.
 */
async function compressImageToDataUrl(
  file: File,
  maxWidth = 960,
  quality = 0.8
): Promise<{ dataUrl: string; base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetW = Math.round(img.width * scale);
        const targetH = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Görsel işleme bağlamı oluşturulamadı.'));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64Data = dataUrl.split(',')[1] || '';
        resolve({ dataUrl, base64Data, mimeType });
      };
      img.onerror = () => reject(new Error('Görsel dosyası okunamadı.'));
      img.src = String(e.target?.result || '');
    };
    reader.onerror = () => reject(new Error('Dosya okuma hatası.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Gemini yanıtındaki olası markdown kod bloklarını (```json ... ```) temizleyerek
 * güvenli bir şekilde JSON.parse işlemi gerçekleştirir.
 */
function safeJsonParse<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned) as T;
}

/**
 * Sandboxed iframe ortamları dahil tüm tarayıcılarda güvenli pano kopyalama sağlar.
 */
async function copyToClipboardSafe(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback'e geç
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textArea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Ücretsiz Gemini, ChatGPT veya Claude web sohbetlerine yapıştırılmak üzere
 * dersin kanonik textbook referanslarını içeren ÖSYM DUS soru üretim komutu oluşturur.
 */
// ============================================================================
// SORU KALİTE MOTORU: Şık dengeleme, doğrulama, dağılım ve tekrar önleme
// ============================================================================

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];

// Aralıklı tekrar: yanlış yapılan soru 1, 3, 7 ve 21 gün sonra tekrar sorulur.
// 4 vadeli tekrarın hepsi doğru yapılınca soru Yanlışlar defterinden çıkar.
const REVIEW_INTERVAL_DAYS = [1, 3, 7, 21];
const DAY_MS = 24 * 60 * 60 * 1000;

function isReviewDue(q: { isWrongPreviously?: boolean; nextReviewAt?: string }, now = Date.now()): boolean {
  if (!q.isWrongPreviously) return false;
  if (!q.nextReviewAt) return true; // eski sürümden kalan yanlışlar hemen tekrar edilebilir
  const t = Date.parse(q.nextReviewAt);
  return Number.isNaN(t) || t <= now;
}

function describeNextReview(q: { nextReviewAt?: string }, now = Date.now()): string {
  if (!q.nextReviewAt) return 'Tekrar zamanı geldi';
  const diff = Date.parse(q.nextReviewAt) - now;
  if (Number.isNaN(diff) || diff <= 0) return 'Tekrar zamanı geldi';
  const days = Math.ceil(diff / DAY_MS);
  return days <= 1 ? 'Tekrar: yarın' : `Tekrar: ${days} gün sonra`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseCorrectLetter(raw: unknown): OptionKey | null {
  const letter = String(raw ?? '').trim().toUpperCase().charAt(0) as OptionKey;
  return OPTION_KEYS.includes(letter) ? letter : null;
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

/** "Yalnız I", "I ve II", "I, II ve III" gibi öncül şıklarını sayı listesine çevirir. */
function premiseOptionKey(text: string): number[] | null {
  const tokens = text.replace(/[.,;:]/g, ' ').split(/\s+/).filter(Boolean);
  const nums: number[] = [];
  for (const t of tokens) {
    const idx = ROMAN_NUMERALS.indexOf(t);
    if (idx >= 0) nums.push(idx + 1);
    else if (!/^(yalnız|yalniz|sadece|ve|ile)$/i.test(t)) return null;
  }
  return nums.length ? nums : null;
}

function comparePremiseKeys(a: number[], b: number[]): number {
  if (a.length !== b.length) return a.length - b.length;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/** Açıklamalardaki "B şıkkı", "(C)", "doğru cevap D" gibi harf atıflarını yeni şık sırasına çevirir. */
function remapLetterReferences(text: string, map: Record<OptionKey, OptionKey>): string {
  if (!text) return text;
  return text.replace(
    /\(([A-E])\)|\b([A-E])(?=\s*(?:şıkk|şık|seçene))|((?:[Cc]evap|[Yy]anıt|[Şş]ık|[Ss]eçenek)\s*:?\s*)([A-E])\b/g,
    (match, paren?: string, before?: string, prefix?: string, after?: string) => {
      if (paren) return `(${map[paren as OptionKey]})`;
      if (before) return map[before as OptionKey];
      if (prefix && after) return prefix + map[after as OptionKey];
      return match;
    }
  );
}

/**
 * Dil modelleri doğru cevabı belirli harflere (çoğunlukla B ve C) yığma eğilimindedir.
 * Normal sorularda şıklar rastgele karıştırılır; öncüllü sorularda ÖSYM'nin kanonik
 * sırasına dizilir (Yalnız I, Yalnız II, I ve II, ... I, II ve III). Doğru cevap ve
 * çeldirici açıklamaları yeni sıraya göre yeniden eşlenir.
 */
function rebalanceQuestionOptions<
  T extends {
    options: QuestionOptions;
    correctAnswer: OptionKey;
    distractorExplanations: DistractorExplanations;
    mechanismExplanation: string;
    premises?: string[];
  }
>(q: T): T {
  let order: OptionKey[]; // order[yeniPozisyon] = eskiHarf
  const premiseKeys =
    q.premises && q.premises.length > 0 ? OPTION_KEYS.map((k) => premiseOptionKey(q.options[k])) : null;

  if (premiseKeys && premiseKeys.every((k) => k !== null)) {
    order = [...OPTION_KEYS].sort((a, b) =>
      comparePremiseKeys(premiseKeys[OPTION_KEYS.indexOf(a)]!, premiseKeys[OPTION_KEYS.indexOf(b)]!)
    );
  } else {
    order = shuffleArray(OPTION_KEYS);
  }

  const oldToNew = {} as Record<OptionKey, OptionKey>;
  order.forEach((oldKey, newIdx) => {
    oldToNew[oldKey] = OPTION_KEYS[newIdx];
  });

  const options = {} as QuestionOptions;
  const distractorExplanations = {} as DistractorExplanations;
  order.forEach((oldKey, newIdx) => {
    const newKey = OPTION_KEYS[newIdx];
    options[newKey] = q.options[oldKey];
    distractorExplanations[newKey] = remapLetterReferences(q.distractorExplanations[oldKey] || '', oldToNew);
  });

  return {
    ...q,
    options,
    distractorExplanations,
    correctAnswer: oldToNew[q.correctAnswer],
    mechanismExplanation: remapLetterReferences(q.mechanismExplanation, oldToNew)
  };
}

/** Kök boş, şık eksik veya aynı şık iki kez yazılmışsa soru havuza alınmaz. */
function isQuestionStructurallyValid(q: { stem: string; options: QuestionOptions }): boolean {
  if (!q.stem || q.stem.trim().length < 15) return false;
  const texts = OPTION_KEYS.map((k) => (q.options[k] || '').trim().toLocaleLowerCase('tr'));
  if (texts.some((t) => !t)) return false;
  return new Set(texts).size === OPTION_KEYS.length;
}

/**
 * Karma deneme için ders dağılımını modele bırakmak yerine uygulama belirler:
 * gerçek DUS'taki oran gibi soruların yaklaşık 1/3'ü Temel, 2/3'ü Klinik Bilimler.
 * Her kategori içinde dersler eşit (rastgele başlangıçlı) dağıtılır, sınavdaki gibi
 * önce Temel sonra Klinik dersler gruplanır.
 */
function buildKarmaSubjectPlan(count: number): string[] {
  const temel = shuffleArray(SUBJECTS.filter((s) => s.category === 'Temel Bilimler'));
  const klinik = shuffleArray(SUBJECTS.filter((s) => s.category === 'Klinik Bilimler'));
  const temelCount = Math.max(1, Math.round(count / 3));
  const klinikCount = Math.max(0, count - temelCount);

  const plan: string[] = [];
  for (let i = 0; i < temelCount; i++) plan.push(temel[i % temel.length].id);
  for (let i = 0; i < klinikCount; i++) plan.push(klinik[i % klinik.length].id);

  const orderIndex = (id: string) => SUBJECTS.findIndex((s) => s.id === id);
  return plan.sort((a, b) => orderIndex(a) - orderIndex(b));
}

function describeSubjectPlan(plan: string[]): string {
  return plan
    .map((id, i) => `${i + 1}. soru: ${SUBJECTS.find((s) => s.id === id)?.name || id}`)
    .join('\n');
}

/** Havuzdaki mevcut sorulardan, tekrar üretilmemesi gereken soru köklerinin kısa özetleri. */
function collectAvoidStems(
  bank: { subjectId: string; subtopic?: string; stem: string; createdAt: string }[],
  subjectIds: string[],
  subtopic: string,
  limit = 25
): string[] {
  const sub = subtopic.trim().toLocaleLowerCase('tr');
  const relevant = bank.filter((q) => subjectIds.includes(q.subjectId));
  const focused = sub
    ? relevant.filter((q) => (q.subtopic || '').toLocaleLowerCase('tr').includes(sub))
    : relevant;
  const source = focused.length > 0 ? focused : relevant;
  return [...source]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit)
    .map((q) => q.stem.replace(/\s+/g, ' ').trim().slice(0, 110));
}

function buildAvoidBlock(avoidStems?: string[]): string {
  if (!avoidStems || avoidStems.length === 0) return '';
  return `\n\nDAHA ÖNCE ÜRETİLMİŞ SORULAR (TEKRARLAMA):
Aşağıdaki sorular kullanıcının havuzunda zaten var. Aynı bilgiyi aynı açıdan ölçen, bunların benzeri veya yeniden yazılmışı olan soru ÜRETME; aynı konuda farklı kazanımları, farklı klinik senaryoları ve farklı ayırt edici noktaları sorgula:
${avoidStems.map((s) => `- ${s}…`).join('\n')}`;
}

const NO_LETTER_REFERENCE_RULE =
  'Açıklamalarda (mechanismExplanation ve distractorExplanations) şıklara harfle ("B şıkkı", "doğru cevap C") ATIF YAPMA; şıklar uygulamada yeniden sıralanacaktır. Şıktan içeriğiyle bahset.';

const VISUAL_WITHOUT_IMAGE_RULE =
  'Kullanıcı görsel EKLEMEDİ. Radyografik/klinik/histolojik bulguları soru kökünde ayrıntılı SÖZEL olarak betimle ("Panoramik radyografide kökün apikal üçlüsünde 1 cm çaplı, sınırları belirgin radyolusent alan izleniyor..."). Kullanıcının göremeyeceği bir görsele ATIF YAPMA: "şekilde", "görselde", "okla gösterilen", "aşağıdaki radyografide" gibi ifadeler YASAK.';

function buildBridgeGenerationPrompt(params: {
  selectedSubjectId: string;
  subtopic: string;
  strictSubtopicLock?: boolean;
  questionType: string;
  count: number;
  difficulty: string;
  avoidStems?: string[];
  subjectPlan?: string[];
  hasImage?: boolean;
}): string {
  const {
    selectedSubjectId,
    subtopic,
    strictSubtopicLock = true,
    questionType,
    count,
    difficulty,
    avoidStems,
    subjectPlan,
    hasImage
  } = params;
  const isKarmaAll = selectedSubjectId === 'karma_all';
  const targetSubjects = isKarmaAll
    ? SUBJECTS
    : SUBJECTS.filter((s) => s.id === selectedSubjectId);

  const trimmedSubtopic = subtopic.trim();
  const isVisualQuestionType = questionType.toLowerCase().includes('görselli');

  const textbookMappingText = targetSubjects
    .map((s) => `- ${s.name} (${s.category}): ${resolveFocusedTextbooks(s, trimmedSubtopic)}`)
    .join('\n');

  const visualPromptRule = isVisualQuestionType
    ? `\n🖼️ GÖRSELLİ SORU KURGUSU ZORUNLULUĞU:
${
        hasImage
          ? '- Sohbete bir radyografi, klinik fotoğraf, histolojik kesit veya anatomik şema eklenecek. Tüm soruları doğrudan o görseldeki bulgulara dayandır ve "imageCaption" alanına görselin klinik tanımını yaz.'
          : `- ${VISUAL_WITHOUT_IMAGE_RULE}`
      }`
    : '';

  const planBlock =
    isKarmaAll && subjectPlan && subjectPlan.length > 0
      ? `\n\n📋 SORU-DERS DAĞILIMI (ZORUNLU, BU SIRAYLA):\n${describeSubjectPlan(subjectPlan)}\nHer sorunun "subject" alanına yukarıdaki ders adını birebir yaz.`
      : '';

  const strictScopeBlock = trimmedSubtopic
    ? `
⚠️ KESİN ALT KONU KİLİDİ (SIFIR SAPMA KURALI):
- İstenen Tek Alt Konu: "${trimmedSubtopic}"
- Üreteceğin ${count} sorunun TAMAMI (1. sorudan ${count}. soruya kadar her biri) %100 oranında doğrudan "${trimmedSubtopic}" alt konusu ile ilgili olmalıdır.
- Bu dersin diğer ünitelerine veya komşu alt konularına (örneğin Protetik seçilip Oklüzyon istendiyse Sabit Protez, Kron-Köprü, Hareketli Protez veya Tam Protez konularına) KESİNLİKLE KAYMA!
- JSON çıktısını yazmadan önce her soruyu kendi içinde denetle: Soru kökü ve şıkları doğrudan "${trimmedSubtopic}" bilgisini ölçmüyorsa o soruyu sil ve yerine doğrudan "${trimmedSubtopic}" sorusu yaz.
- Tüm sorularda "subtopic" alanını "${trimmedSubtopic}" olarak etiketle.`
    : '';

  return `Sen Türkiye'de ÖSYM tarafından düzenlenen Diş Hekimliğinde Uzmanlık Sınavı (DUS) için soru hazırlayan kıdemli bir diş hekimliği ve temel tıp akademisyenisin.

GÖREV:
Aşağıdaki parametrelere göre tam ${count} adet özgün, bilimsel doğruluğu %100 kesin, çeldiricileri güçlü, ÖSYM DUS formatında çoktan seçmeli soru üret. Soruları kurgularken hem uluslararası kanonik textbook'ları hem de daha önce ÖSYM DUS sınavlarında sorulmuş çıkmış DUS sorularının konseptlerini, sorgulama mantığını ve klasik ÖSYM çeldirici kalıplarını birlikte referans al.

SINAV PARAMETRELERİ:
- Hedef Ders(ler): ${
    isKarmaAll
      ? 'Karma DUS Denemesi (Klinik Bilimler ve Temel Bilimler derslerinden dengeli dağılım)'
      : `${targetSubjects[0].name} (${targetSubjects[0].category})`
  }
- Alt Konu / Odak: ${
    trimmedSubtopic
      ? `SADECE "${trimmedSubtopic}" (Başka hiçbir konudan soru sorulmayacak!)`
      : 'Seçilen dersin DUS’ta en sık sorgulanan yüksek verimli konuları'
  }
- Soru Kurgusu / Tipi: ${questionType}
- Zorluk Seviyesi: ${difficulty}
- İstenen Soru Sayısı: ${count}${planBlock}
${visualPromptRule}
${strictSubtopicLock ? strictScopeBlock : ''}${buildAvoidBlock(avoidStems)}

ÇİFT KATMANLI ZORUNLU REFERANS MOTORU (TEXTBOOK + ÇIKMIŞ DUS SORULARI):
1. Kanonik Textbook Referansları (Bilimsel Doğruluk Tabanı):
Soruları ve çözüm analizlerini yalnızca aşağıdaki kanonik textbook'ların güncel baskılarındaki bilimsel konsensüse dayandır:
${textbookMappingText}

2. ÖSYM Çıkmış DUS Soruları Referans Analizi (Sınav Kurgusu ve Çeldirici Tabanı):
- Daha önce ÖSYM DUS sınavlarında bu ders ve alt konudan sorulmuş çıkmış soruların odaklandığı ayrıcı tanı noktalarını, istisnai kuralları, sınıflandırmaları ve sayısal/anatomik eşikleri temel al.
- Çıkmış DUS sorularını birebir kopyalamak yerine, aynı yüksek verimli DUS kazanımını farklı bir klinik vaka, öncül kombinasyonu veya ters köşe çeldirici kurgusuyla yeniden sentezle.
- "textbookReference" alanında hem ilgili textbook adını/bölümünü hem de bağlantılı olduğu DUS sorgulama konseptini (örn. "Cohen's Pathways of the Pulp, Böl. 6 • ÖSYM DUS Çıkmış Soru Konsepti: İrrigasyon Etkileşimleri") belirt.

KESİN FORMAT VE İÇERİK KURALLARI:
1. Yanıt olarak SADECE geçerli bir JSON nesnesi döndür. Giriş/çıkış sohbet metni ekleme.
2. Her soruda A, B, C, D, E olmak üzere tam 5 şık bulunmalıdır.
3. Eğer soru öncüllü ise "premises" dizisine ["I. ...", "II. ...", "III. ..."] ekle ve soru kökünü ("stem") buna bağla. Öncüllü değilse "premises": [] bırak.
4. "distractorExplanations" alanında yanlış olan 4 şıkkın her birinin NEDEN yanlış olduğunu bilimsel gerekçesiyle ayrı ayrı açıkla; doğru şık için "Doğru seçenektir." yaz.
5. Her soruda ÖNCE "mechanismExplanation" ve "distractorExplanations" alanlarını düşünerek yaz, "correctAnswer" alanını EN SON, bu açıklamalarla tutarlı olacak şekilde belirle.
6. ${NO_LETTER_REFERENCE_RULE}

ÇIKTI JSON ŞEMASI (ALAN SIRASINA BİREBİR UYULMALIDIR):
{
  "questions": [
    {
      "subject": "Ders Adı",
      "category": "Klinik Bilimler veya Temel Bilimler",
      "subtopic": "${trimmedSubtopic || 'Alt Konu Başlığı'}",
      "questionType": "${questionType}",
      "difficulty": "${difficulty}",
      "stem": "Soru kökü metni...",
      "premises": [],
      "options": {
        "A": "A şıkkı metni",
        "B": "B şıkkı metni",
        "C": "C şıkkı metni",
        "D": "D şıkkı metni",
        "E": "E şıkkı metni"
      },
      "textbookReference": "İlgili Textbook Adı, Baskı/Bölüm + İlgili Çıkmış DUS Konsepti",
      "mechanismExplanation": "Doğru cevabın klinik/biyolojik/anatomik mekanizma özeti ve ÖSYM DUS sınavlarında bu bilginin nasıl sorgulandığına dair vurgu...",
      "distractorExplanations": {
        "A": "Bu şıkkın neden yanlış (veya doğru) olduğunun açıklaması...",
        "B": "...",
        "C": "...",
        "D": "...",
        "E": "..."
      },
      "correctAnswer": "Açıklamalarla tutarlı doğru şıkkın harfi (A, B, C, D veya E)"
    }
  ]
}`;
}

/**
 * Sohbet arayüzünden kopyalanan metnin içindeki JSON bloğunu (giriş/çıkış sohbet metni olsa dahi)
 * ayıklar, doğrular ve uygulama veri yapısına normalize eder.
 */
function extractAndNormalizeBridgeQuestions(
  rawInput: string,
  defaults: {
    selectedSubjectId: string;
    subtopic: string;
    questionType: string;
    difficulty: string;
  }
): { questions: DUSQuestion[]; dropped: number } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Lütfen önce yapay zekanın ürettiği JSON yanıtını kutuya yapıştırın.');
  }

  let jsonCandidate = trimmed;

  // 1. Markdown ```json ... ``` bloğu varsa içini al
  const fenceMatch = trimmed.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (fenceMatch && fenceMatch[1]) {
    jsonCandidate = fenceMatch[1].trim();
  } else {
    // 2. Sohbet metniyle çevriliyse ilk '{' veya '[' ile son '}' veya ']' arasını kes
    const firstObj = trimmed.indexOf('{');
    const firstArr = trimmed.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
      startIdx = firstArr;
      endIdx = trimmed.lastIndexOf(']');
    } else if (firstObj !== -1) {
      startIdx = firstObj;
      endIdx = trimmed.lastIndexOf('}');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      jsonCandidate = trimmed.slice(startIdx, endIdx + 1);
    }
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch {
    throw new Error(
      'Yapıştırılan metinde geçerli bir JSON yapısı bulunamadı. Lütfen yapay zekanın verdiği JSON kod bloğunun tamamını kopyaladığınızdan emin olun.'
    );
  }

  const rawList: any[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.questions)
    ? parsed.questions
    : parsed && typeof parsed === 'object' && parsed.stem && parsed.options
    ? [parsed]
    : [];

  if (rawList.length === 0) {
    throw new Error('JSON içinde soru listesi ("questions" dizisi) bulunamadı.');
  }

  const isKarmaAll = defaults.selectedSubjectId === 'karma_all';
  const fallbackSubjects = isKarmaAll
    ? SUBJECTS
    : SUBJECTS.filter((s) => s.id === defaults.selectedSubjectId);
  const nowIso = new Date().toISOString();
  const validLetters: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];

  const normalized = rawList.map((item, idx): DUSQuestion | null => {
    if (!item || typeof item !== 'object' || !item.stem || !item.options) {
      return null;
    }

    const opts = item.options;
    for (const key of validLetters) {
      if (!opts[key] || String(opts[key]).trim() === '') {
        return null;
      }
    }

    const rawSubjName = String(item.subject || item.subjectName || '').trim();
    const lowerSubj = rawSubjName.toLowerCase();
    const matchedSubject =
      SUBJECTS.find(
        (s) =>
          s.name.toLowerCase() === lowerSubj ||
          lowerSubj.includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(lowerSubj) ||
          (s.id === 'fizyoloji_histoloji' &&
            (lowerSubj.includes('fizyoloji') ||
              lowerSubj.includes('histoloji') ||
              lowerSubj.includes('embriyoloji'))) ||
          (s.id === 'farmakoloji_genetik' &&
            (lowerSubj.includes('farmakoloji') ||
              lowerSubj.includes('biyoloji') ||
              lowerSubj.includes('genetik'))) ||
          (s.id === 'pedodonti' &&
            (lowerSubj.includes('pedodonti') || lowerSubj.includes('çocuk')))
      ) || (isKarmaAll ? SUBJECTS[idx % SUBJECTS.length] : fallbackSubjects[0]);

    // Geçersiz cevap harfi artık sessizce "A" yapılmaz; soru havuza alınmaz.
    const correctAnswer = parseCorrectLetter(item.correctAnswer ?? item.correctOption);
    if (!correctAnswer) return null;

    const premisesList = Array.isArray(item.premises)
      ? item.premises.map((p: any) => String(p).trim()).filter(Boolean)
      : [];

    const distractors = item.distractorExplanations || item.wrongExplanations || {};

    const question: DUSQuestion = {
      id: `dus-bridge-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      subjectId: matchedSubject.id,
      subject: matchedSubject.name,
      category: matchedSubject.category,
      subtopic: String(item.subtopic || defaults.subtopic || '').trim(),
      questionType: String(item.questionType || defaults.questionType),
      difficulty: String(item.difficulty || defaults.difficulty),
      stem: String(item.stem).trim(),
      premises: premisesList,
      imageUrl: item.imageUrl ? String(item.imageUrl).trim() : undefined,
      imageCaption: item.imageCaption ? String(item.imageCaption).trim() : undefined,
      options: {
        A: String(opts.A).trim(),
        B: String(opts.B).trim(),
        C: String(opts.C).trim(),
        D: String(opts.D).trim(),
        E: String(opts.E).trim()
      },
      correctAnswer,
      textbookReference: String(item.textbookReference || matchedSubject.textbooks).trim(),
      mechanismExplanation: String(
        item.mechanismExplanation || item.explanation || 'Kanonik textbook bilgisine göre doğru yanıt budur.'
      ).trim(),
      distractorExplanations: {
        A: String(distractors.A || '').trim(),
        B: String(distractors.B || '').trim(),
        C: String(distractors.C || '').trim(),
        D: String(distractors.D || '').trim(),
        E: String(distractors.E || '').trim()
      },
      createdAt: nowIso,
      isFavorite: false,
      isWrongPreviously: false,
      attemptsCount: 0,
      correctCount: 0
    };

    if (!isQuestionStructurallyValid(question)) return null;
    return rebalanceQuestionOptions(question);
  });

  const questions = normalized.filter((q): q is DUSQuestion => q !== null);
  const dropped = normalized.length - questions.length;
  if (questions.length === 0) {
    throw new Error(
      'Yapıştırılan yanıttaki soruların hiçbiri geçerli değil (eksik şık, aynı şık iki kez veya geçersiz doğru cevap). Lütfen yapay zekadan yeniden üretmesini isteyin.'
    );
  }
  return { questions, dropped };
}

/**
 * API'siz Denetçi Modu (Akademik Doğrulama) için kopyalanabilir denetim komutu üretir.
 */
function buildBridgeAuditPrompt(question: DUSQuestion): string {
  const subjectObj = SUBJECTS.find((s) => s.id === question.subjectId);
  const textbooks = subjectObj ? subjectObj.textbooks : question.textbookReference;
  const premisesText =
    question.premises && question.premises.length > 0
      ? `\nÖncüller:\n${question.premises.join('\n')}`
      : '';

  return `Sen ÖSYM DUS soru denetim kurulunda görev yapan kıdemli bir akademisyen denetçisin.
Aşağıdaki DUS sorusunu ve çözümünü belirtilen kanonik textbook referanslarına göre denetle:
Referans Textbook'lar: ${textbooks}

DENETLENECEK SORU:
Ders: ${question.subject} (${question.category})
Soru Kökü: ${question.stem}${premisesText}
A) ${question.options.A}
B) ${question.options.B}
C) ${question.options.C}
D) ${question.options.D}
E) ${question.options.E}
İddia Edilen Doğru Cevap: ${question.correctAnswer}
Mevcut Açıklama: ${question.mechanismExplanation}

Yanıt olarak SADECE aşağıdaki JSON formatında denetim raporu döndür:
{
  "isVerified": true,
  "confidenceScore": 98,
  "verdictTitle": "Akademik Kurul Onayı: Textbook Bilgisiyle Tam Uyumlu",
  "detailedReview": "Bilimsel doğrulama ve çeldirici analizi...",
  "editionNotes": "Güncel textbook baskıları (edition) arasında fark olup olmadığına dair not..."
}`;
}

function extractAndNormalizeBridgeAudit(rawInput: string): AuditResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Lütfen yapay zekanın döndürdüğü denetim JSON yanıtını yapıştırın.');
  }

  let jsonCandidate = trimmed;
  const fenceMatch = trimmed.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (fenceMatch && fenceMatch[1]) {
    jsonCandidate = fenceMatch[1].trim();
  } else {
    const firstObj = trimmed.indexOf('{');
    const lastObj = trimmed.lastIndexOf('}');
    if (firstObj !== -1 && lastObj > firstObj) {
      jsonCandidate = trimmed.slice(firstObj, lastObj + 1);
    }
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch {
    throw new Error('Denetim yanıtı geçerli bir JSON olarak ayrıştırılamadı.');
  }

  return {
    isVerified: parsed.isVerified !== false,
    confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidenceScore) || 95)),
    verdictTitle:
      String(parsed.verdictTitle || '').trim() ||
      (parsed.isVerified !== false
        ? 'Akademik Kurul Onayı: Textbook Bilgisiyle Tam Uyumlu'
        : 'Akademik Kurul Uyarısı: Literatür Nüansı Tespit Edildi'),
    detailedReview:
      String(parsed.detailedReview || '').trim() ||
      'Soru kanonik textbook referansları ile tutarlıdır.',
    editionNotes:
      String(parsed.editionNotes || '').trim() ||
      'Güncel textbook baskıları arasında çelişki bulunmamaktadır.',
    checkedAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  };
}

/**
 * Gemini HTTP hata kodlarını kullanıcı dostu Türkçe açıklamalara dönüştürür.
 */
function parseGeminiHttpError(status: number, rawMessage?: string): string {
  const msg = (rawMessage || '').toLowerCase();
  if (status === 400 && (msg.includes('api key') || msg.includes('api_key'))) {
    return 'Geçersiz API Anahtarı: Girdiğiniz Google Gemini API anahtarı hatalı veya eksik. Lütfen AI Studio üzerinden anahtarınızı kontrol edin.';
  }
  if (status === 403) {
    return 'Erişim Reddedildi (403): API anahtarınızın bu modele erişim izni yok veya bölge/fatura kısıtlaması bulunuyor.';
  }
  if (status === 429) {
    return 'Kota Aşımı (429): Ücretsiz/mevcut Gemini API istek limitine ulaşıldı. Lütfen 30-60 saniye bekleyip tekrar deneyin.';
  }
  if (status === 404) {
    return 'Model Bulunamadı (404): Seçilen Gemini modeli şu anda kullanılamıyor. API Ayarlarından "gemini-2.5-flash" modelini seçmeyi deneyin.';
  }
  if (status >= 500) {
    return `Google Sunucu Hatası (${status}): Gemini servisinde geçici yoğunluk yaşanıyor. Lütfen birkaç saniye sonra tekrar deneyin.`;
  }
  return rawMessage ? `Gemini API Hatası (${status}): ${rawMessage}` : `Beklenmeyen API Hatası (HTTP ${status})`;
}

/**
 * API Ayarları modalındaki "Bağlantıyı Test Et" butonu için hafif doğrulama çağrısı.
 */
async function testGeminiConnection(apiKey: string, model: string): Promise<{ ok: boolean; message: string }> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return { ok: false, message: 'Lütfen önce bir Google Gemini API anahtarı girin.' };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(trimmedKey)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Merhaba, yalnızca "OK" yaz.' }] }],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0
        }
      })
    });

    if (!response.ok) {
      let errMsg = '';
      try {
        const errData = await response.json();
        errMsg = errData?.error?.message || '';
      } catch {
        // ignore
      }
      return { ok: false, message: parseGeminiHttpError(response.status, errMsg) };
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply) {
      return {
        ok: true,
        message: `Bağlantı başarılı! (${model} modeli aktif ve soru üretimine hazır.)`
      };
    }
    return { ok: false, message: 'API yanıt verdi ancak içerik boş döndü.' };
  } catch (err: any) {
    return {
      ok: false,
      message: `Ağ Bağlantı Hatası: İnternet bağlantınızı kontrol edin (${err?.message || 'Failed to fetch'}).`
    };
  }
}

/**
 * OpenAPI responseSchema ile %100 yapılandırılmış DUS soruları üreten fonksiyon.
 * Opsiyonel olarak yüklenen klinik/radyografik görseli multimodal (Vision) olarak analiz eder.
 */
type GeminiGenerationParams = {
  apiKey: string;
  model: string;
  selectedSubjectId: string;
  subtopic: string;
  strictSubtopicLock?: boolean;
  questionType: string;
  count: number;
  difficulty: string;
  referenceImage?: { dataUrl: string; base64Data: string; mimeType: string; caption?: string } | null;
};

const MAX_QUESTIONS_PER_REQUEST = 10;
const MAX_PARALLEL_REQUESTS = 3;

/**
 * Soruları en fazla 10'arlık istekler halinde (aynı anda en fazla 3 istek) üretir.
 * Tek dev istek yanıtın yarıda kesilip TÜM soruların kaybolmasına yol açabiliyordu;
 * artık bir parça başarısız olsa da diğerleri kullanılır.
 * Karma denemede ders dağılımını uygulama belirler; her parçaya o derslerin daha önce
 * üretilmiş soru kökleri "tekrarlama" listesi olarak verilir.
 */
async function generateQuestionsFromGemini(
  params: GeminiGenerationParams & {
    getAvoidStems?: (subjectIds: string[]) => string[];
  }
): Promise<{ questions: DUSQuestion[]; dropped: number; failedRequests: number; lastError?: string }> {
  const { count, selectedSubjectId, getAvoidStems } = params;
  const isKarmaAll = selectedSubjectId === 'karma_all';

  type Chunk = { count: number; subjectPlan?: string[] };
  const chunks: Chunk[] = [];
  if (isKarmaAll) {
    const plan = buildKarmaSubjectPlan(count);
    for (let i = 0; i < plan.length; i += MAX_QUESTIONS_PER_REQUEST) {
      const part = plan.slice(i, i + MAX_QUESTIONS_PER_REQUEST);
      chunks.push({ count: part.length, subjectPlan: part });
    }
  } else {
    for (let remaining = count; remaining > 0; remaining -= MAX_QUESTIONS_PER_REQUEST) {
      chunks.push({ count: Math.min(MAX_QUESTIONS_PER_REQUEST, remaining) });
    }
  }

  const results: ({ questions: DUSQuestion[]; dropped: number } | Error)[] = new Array(chunks.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < chunks.length) {
      const i = cursor++;
      const chunk = chunks[i];
      const subjectIds = chunk.subjectPlan ? [...new Set(chunk.subjectPlan)] : [selectedSubjectId];
      try {
        results[i] = await requestQuestionBatch({
          ...params,
          count: chunk.count,
          subjectPlan: chunk.subjectPlan,
          avoidStems: getAvoidStems ? getAvoidStems(subjectIds) : []
        });
      } catch (err: any) {
        results[i] = err instanceof Error ? err : new Error(String(err));
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL_REQUESTS, chunks.length) }, worker));

  const questions: DUSQuestion[] = [];
  let dropped = 0;
  let failedRequests = 0;
  let lastError: string | undefined;
  for (const r of results) {
    if (r instanceof Error) {
      failedRequests++;
      lastError = r.message;
    } else {
      questions.push(...r.questions);
      dropped += r.dropped;
    }
  }

  if (questions.length === 0) {
    throw new Error(lastError || 'Hiç geçerli soru üretilemedi. Lütfen tekrar deneyin.');
  }
  return { questions, dropped, failedRequests, lastError };
}

async function requestQuestionBatch(
  params: GeminiGenerationParams & { subjectPlan?: string[]; avoidStems?: string[] }
): Promise<{ questions: DUSQuestion[]; dropped: number }> {
  const {
    apiKey,
    model,
    selectedSubjectId,
    subtopic,
    strictSubtopicLock = true,
    questionType,
    count,
    difficulty,
    referenceImage,
    subjectPlan,
    avoidStems
  } = params;

  const isKarmaAll = selectedSubjectId === 'karma_all';
  const targetSubjects = isKarmaAll
    ? subjectPlan && subjectPlan.length > 0
      ? SUBJECTS.filter((s) => subjectPlan.includes(s.id))
      : SUBJECTS
    : SUBJECTS.filter((s) => s.id === selectedSubjectId);

  const trimmedSubtopic = subtopic.trim();
  const isVisualQuestionType = questionType.toLowerCase().includes('görselli');

  const textbookMappingText = targetSubjects
    .map((s) => `- ${s.name} (${s.category}): ${resolveFocusedTextbooks(s, trimmedSubtopic)}`)
    .join('\n');

  const strictScopeInstruction =
    trimmedSubtopic && strictSubtopicLock
      ? `\nKESİN ALT KONU KİLİDİ (SIFIR SAPMA ZORUNLULUĞU):
Üretilen ${count} sorunun TAMAMI münhasıran "${trimmedSubtopic}" alt konusu hakkında olmalıdır. Seçilen dersin diğer ünitelerine veya komşu alt konularına (örneğin Protetik Diş Tedavisi seçilip Oklüzyon istendiyse Sabit Protez, Hareketli Protez veya Tam Protez konularına) KESİNLİKLE KAYMA! Her bir soruyu üretirken doğrudan "${trimmedSubtopic}" konusunu ölçtüğünü doğrula.`
      : '';

  const systemPrompt = `Sen Türkiye'de ÖSYM tarafından düzenlenen Diş Hekimliğinde Uzmanlık Sınavı (DUS) için soru hazırlayan kıdemli bir diş hekimliği ve temel tıp akademisyenisin.
Görevin, hem uluslararası kanonik textbook'ları hem de daha önce ÖSYM DUS sınavlarında sorulmuş çıkmış DUS sorularının konseptlerini, ayrıcı tanı noktalarını ve klasik ÖSYM çeldirici kalıplarını sentezleyerek bilimsel doğruluğu %100 kesin özgün çoktan seçmeli sorular üretmektir.

ÇİFT KATMANLI ZORUNLU REFERANS EŞLEŞTİRMESİ:
1. Kanonik Textbook Referansları:
Soruları kurgularken ve açıklamaları yazarken yalnızca aşağıdaki uluslararası kanonik referans textbook'ların güncel baskılarındaki bilimsel konsensüsü esas almalısın:
${textbookMappingText}

2. Çıkmış DUS Soruları ve ÖSYM Sorgulama Kalıpları:
- Geçmiş DUS sınavlarında sorulmuş klasik vaka kurgularını, öncüllü (I, II, III) bilgi sentezlerini, sınıflandırma/kural istisnalarını ve ÖSYM'nin adayları düşürmek için kullandığı tipik çeldiricileri referans al.
- Çıkmış soruları birebir tekrar etmek yerine, aynı DUS kazanımını özgün klinik senaryolarla ve güncel textbook kanıtlarıyla yeniden kurgula.
${strictScopeInstruction}

KESİN KURALLAR:
1. Her soruda A, B, C, D, E olmak üzere tam 5 seçenek bulunmalıdır.
2. Doğru cevap tek ve tartışmasız olmalıdır; güncel textbook baskıları arasında çelişki yaratacak muğlak ifadelerden kaçınılmalıdır.
3. Seçenek uzunlukları ve dil yapıları ÖSYM standartlarında dengeli olmalıdır ("Hepsi", "Hiçbiri" gibi basit kalıplardan kaçınılmalıdır).
4. Eğer soru tipi "Öncüllü Soru (I, II, III)" ise "premises" dizisine ["I. ...", "II. ...", "III. ..."] şeklinde öncülleri yerleştir ve soru kökünde ("stem") "Yukarıdaki ifadelerden hangileri doğrudur?" şeklinde bağla. Öncüllü değilse "premises" dizisini boş [] bırak.
5. "textbookReference" alanında hem referans alınan kanonik textbook adını/bölümünü hem de ilişkili çıkmış DUS soru konseptini yaz.
6. "mechanismExplanation" alanında doğru cevabın klinik/biyolojik/anatomik mekanizmasını ve ÖSYM DUS'ta bu konunun hangi ayırt edici noktadan sorgulandığını net özetle.
7. "distractorExplanations" nesnesinde A, B, C, D, E şıklarının her biri için açıklama yaz (yanlış olan 4 şıkkın neden yanlış olduğunu madde madde bilimsel gerekçesiyle açıkla; doğru şık için "Doğru seçenektir." yaz).
8. Her soruda önce "mechanismExplanation" ve "distractorExplanations" alanlarını yaz; "correctAnswer" alanını EN SON, bu açıklamalarla tutarlı olacak şekilde belirle.
9. ${NO_LETTER_REFERENCE_RULE}`;

  const userPrompt = `Lütfen aşağıdaki parametrelere göre tam ${count} adet özgün DUS sorusu üret:
- Hedef Ders(ler): ${
    isKarmaAll
      ? subjectPlan && subjectPlan.length > 0
        ? `Karma DUS Denemesi. Soru-ders dağılımı ZORUNLU olarak şu sırayla (her sorunun "subject" alanına bu ders adını birebir yaz):\n${describeSubjectPlan(subjectPlan)}`
        : 'Karma DUS Denemesi (Hem Klinik Bilimler hem Temel Bilimler derslerinden dengeli dağılım)'
      : `${targetSubjects[0].name} (${targetSubjects[0].category})`
  }
- Alt Konu / Odak: ${
    trimmedSubtopic
      ? `SADECE "${trimmedSubtopic}" (Başka hiçbir alt konudan soru sorma!)`
      : 'Belirtilmedi (Seçilen dersin DUS’ta en sık sorgulanan yüksek verimli konularından)'
  }
- Soru Tipi: ${questionType}
- Zorluk Seviyesi: ${difficulty}
- İstenen Soru Sayısı: ${count}${
    referenceImage
      ? `\n- GÖRSEL TABANLI SORU ZORUNLULUĞU: Sana ekte bir klinik/radyografik/histolojik görsel gönderildi${
          referenceImage.caption ? ` (Görsel Açıklaması: "${referenceImage.caption}")` : ''
        }. Üreteceğin ${count} sorunun TAMAMI doğrudan bu görseldeki anatomik yapıları, radyografik bulguları, patolojiyi veya klinik durumu yorumlatan ÖSYM DUS görsel soruları olmalıdır. Soru kökünde "Şekilde / Radyografide / Klinik fotoğrafta okla veya genel görünümle izlenen..." gibi ifadeler kullan.`
      : isVisualQuestionType
      ? `\n- GÖRSEL BULGU YORUMLAMA SORUSU: Üreteceğin ${count} sorunun TAMAMI radyografik, klinik, histolojik veya anatomik bulguların yorumlanmasına dayalı olmalıdır. ${VISUAL_WITHOUT_IMAGE_RULE}`
      : ''
  }${buildAvoidBlock(avoidStems)}`;

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      questions: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            subject: { type: 'STRING' },
            category: { type: 'STRING', enum: ['Klinik Bilimler', 'Temel Bilimler'] },
            subtopic: { type: 'STRING' },
            questionType: { type: 'STRING' },
            difficulty: { type: 'STRING' },
            stem: { type: 'STRING' },
            premises: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            },
            options: {
              type: 'OBJECT',
              properties: {
                A: { type: 'STRING' },
                B: { type: 'STRING' },
                C: { type: 'STRING' },
                D: { type: 'STRING' },
                E: { type: 'STRING' }
              },
              required: ['A', 'B', 'C', 'D', 'E']
            },
            textbookReference: { type: 'STRING' },
            mechanismExplanation: { type: 'STRING' },
            distractorExplanations: {
              type: 'OBJECT',
              properties: {
                A: { type: 'STRING' },
                B: { type: 'STRING' },
                C: { type: 'STRING' },
                D: { type: 'STRING' },
                E: { type: 'STRING' }
              },
              required: ['A', 'B', 'C', 'D', 'E'],
              propertyOrdering: ['A', 'B', 'C', 'D', 'E']
            },
            // Cevap harfi, açıklamalar yazıldıktan SONRA üretilir (önce gerekçe, sonra karar)
            correctAnswer: { type: 'STRING', enum: ['A', 'B', 'C', 'D', 'E'] }
          },
          propertyOrdering: [
            'subject',
            'category',
            'subtopic',
            'questionType',
            'difficulty',
            'stem',
            'premises',
            'options',
            'textbookReference',
            'mechanismExplanation',
            'distractorExplanations',
            'correctAnswer'
          ],
          required: [
            'subject',
            'category',
            'subtopic',
            'questionType',
            'difficulty',
            'stem',
            'premises',
            'options',
            'correctAnswer',
            'textbookReference',
            'mechanismExplanation',
            'distractorExplanations'
          ]
        }
      }
    },
    required: ['questions']
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const userParts: any[] = [{ text: userPrompt }];
  if (referenceImage?.base64Data) {
    userParts.push({
      inline_data: {
        mime_type: referenceImage.mimeType,
        data: referenceImage.base64Data
      }
    });
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: userParts
          }
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema
        }
      })
    });
  } catch (networkErr: any) {
    throw new Error(`Ağ Bağlantı Hatası: Google Gemini sunucusuna ulaşılamadı (${networkErr?.message || 'Network Error'}).`);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || '';
    } catch {
      // ignore parse error
    }
    throw new Error(parseGeminiHttpError(response.status, errorDetail));
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API boş veya eksik bir yanıt döndürdü. Lütfen tekrar deneyin.');
  }

  let parsedPayload: { questions?: any[] };
  try {
    parsedPayload = safeJsonParse<{ questions?: any[] }>(rawText);
  } catch (e: any) {
    throw new Error(`Üretilen JSON yanıtı ayrıştırılamadı: ${e.message}`);
  }

  const rawList = Array.isArray(parsedPayload)
    ? parsedPayload
    : Array.isArray(parsedPayload?.questions)
    ? parsedPayload.questions
    : [];

  if (rawList.length === 0) {
    throw new Error('Model geçerli soru dizisi döndürmedi. Lütfen parametreleri kontrol edip tekrar deneyin.');
  }

  const nowIso = new Date().toISOString();
  const planMatchesOutput = Boolean(subjectPlan && subjectPlan.length === rawList.length);

  const normalized = rawList.map((item, idx): DUSQuestion | null => {
    const rawSubjName = String(item.subject || item.subjectName || '').trim();
    const lowerSubj = rawSubjName.toLowerCase();
    const plannedSubject = planMatchesOutput
      ? SUBJECTS.find((s) => s.id === subjectPlan![idx])
      : undefined;
    const matchedSubject =
      plannedSubject ||
      SUBJECTS.find(
        (s) =>
          s.name.toLowerCase() === lowerSubj ||
          lowerSubj.includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(lowerSubj) ||
          (s.id === 'fizyoloji_histoloji' &&
            (lowerSubj.includes('fizyoloji') ||
              lowerSubj.includes('histoloji') ||
              lowerSubj.includes('embriyoloji'))) ||
          (s.id === 'farmakoloji_genetik' &&
            (lowerSubj.includes('farmakoloji') ||
              lowerSubj.includes('biyoloji') ||
              lowerSubj.includes('genetik'))) ||
          (s.id === 'pedodonti' &&
            (lowerSubj.includes('pedodonti') || lowerSubj.includes('çocuk')))
      ) || (isKarmaAll ? targetSubjects[idx % targetSubjects.length] : targetSubjects[0]);

    // Geçersiz cevap harfi artık sessizce "A" yapılmaz; soru havuza alınmaz.
    const correctAnswer = parseCorrectLetter(item.correctAnswer);
    if (!correctAnswer) return null;

    const premisesList = Array.isArray(item.premises)
      ? item.premises.map((p: any) => String(p).trim()).filter(Boolean)
      : [];

    const question: DUSQuestion = {
      id: `dus-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      subjectId: matchedSubject.id,
      subject: matchedSubject.name,
      category: matchedSubject.category,
      subtopic: String(item.subtopic || subtopic || '').trim(),
      questionType: String(item.questionType || questionType),
      difficulty: String(item.difficulty || difficulty),
      stem: String(item.stem || '').trim(),
      premises: premisesList,
      imageUrl: referenceImage?.dataUrl || (item.imageUrl ? String(item.imageUrl).trim() : undefined),
      imageCaption:
        referenceImage?.caption?.trim() ||
        (referenceImage ? 'Klinik / Radyografik Vaka Görseli' : item.imageCaption ? String(item.imageCaption).trim() : undefined),
      options: {
        A: String(item.options?.A || ''),
        B: String(item.options?.B || ''),
        C: String(item.options?.C || ''),
        D: String(item.options?.D || ''),
        E: String(item.options?.E || '')
      },
      correctAnswer,
      textbookReference: String(item.textbookReference || matchedSubject.textbooks),
      mechanismExplanation: String(item.mechanismExplanation || ''),
      distractorExplanations: {
        A: String(item.distractorExplanations?.A || ''),
        B: String(item.distractorExplanations?.B || ''),
        C: String(item.distractorExplanations?.C || ''),
        D: String(item.distractorExplanations?.D || ''),
        E: String(item.distractorExplanations?.E || '')
      },
      createdAt: nowIso,
      isFavorite: false,
      isWrongPreviously: false,
      attemptsCount: 0,
      correctCount: 0
    };

    if (!isQuestionStructurallyValid(question)) return null;
    return rebalanceQuestionOptions(question);
  });

  const questions = normalized.filter((q): q is DUSQuestion => q !== null);
  if (questions.length === 0) {
    throw new Error('Model geçerli soru üretmedi (eksik şık veya geçersiz doğru cevap). Lütfen tekrar deneyin.');
  }
  return { questions, dropped: normalized.length - questions.length };
}

/**
 * Kıdemli DUS Akademisyeni Denetçi Modu (İkinci Gemini API çağrısı + responseSchema).
 */
async function auditQuestionWithGemini(params: {
  apiKey: string;
  model: string;
  question: DUSQuestion;
}): Promise<AuditResult> {
  const { apiKey, model, question } = params;
  const subjectObj = SUBJECTS.find((s) => s.id === question.subjectId);
  const textbooks = subjectObj ? subjectObj.textbooks : question.textbookReference;

  const systemPrompt = `Sen ÖSYM DUS soru denetim kurulunda görev yapan kıdemli bir akademisyen denetçisin.
Sana verilen bir DUS sorusunu, öncüllerini, 5 şıkkını ve çözümünü aşağıdaki kanonik textbook referanslarına göre denetle:
Referans Textbook'lar: ${textbooks}

Denetim Kriterleri:
1. Doğru kabul edilen şıkkın bilimsel olarak %100 kesin olup olmadığını kontrol et.
2. Diğer 4 şıktan herhangi birinin de doğru kabul edilebileceği bir "çift cevap", "eski/yeni baskı (edition) farkı" veya "terminoloji belirsizliği" bulunup bulunmadığını tespit et.
3. Akademik kurul üslubuyla net bir denetim raporu üret.`;

  const premisesText =
    question.premises && question.premises.length > 0
      ? `\nÖncüller:\n${question.premises.join('\n')}`
      : '';

  const userPrompt = `Aşağıdaki DUS sorusunu akademik kurul gözüyle denetle:
Ders: ${question.subject} (${question.category})
Soru Kökü: ${question.stem}${premisesText}
A) ${question.options.A}
B) ${question.options.B}
C) ${question.options.C}
D) ${question.options.D}
E) ${question.options.E}
İddia Edilen Doğru Cevap: ${question.correctAnswer}
Referans: ${question.textbookReference}
Mevcut Açıklama: ${question.mechanismExplanation}`;

  const auditSchema = {
    type: 'OBJECT',
    properties: {
      isVerified: { type: 'BOOLEAN' },
      confidenceScore: { type: 'INTEGER' },
      verdictTitle: { type: 'STRING' },
      detailedReview: { type: 'STRING' },
      editionNotes: { type: 'STRING' }
    },
    required: ['isVerified', 'confidenceScore', 'verdictTitle', 'detailedReview', 'editionNotes']
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: auditSchema
        }
      })
    });
  } catch (err: any) {
    throw new Error(`Denetim Ağ Hatası: ${err?.message || 'Sunucuya erişilemedi'}`);
  }

  if (!response.ok) {
    let errMsg = '';
    try {
      const errJson = await response.json();
      errMsg = errJson?.error?.message || '';
    } catch {
      // ignore
    }
    throw new Error(parseGeminiHttpError(response.status, errMsg));
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = safeJsonParse<{
    isVerified: boolean;
    confidenceScore: number;
    verdictTitle: string;
    detailedReview: string;
    editionNotes: string;
  }>(rawText);

  return {
    isVerified: Boolean(parsed.isVerified),
    confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidenceScore) || 95)),
    verdictTitle:
      parsed.verdictTitle ||
      (parsed.isVerified
        ? 'Akademik Kurul Onayı: Textbook Bilgisiyle Tam Uyumlu'
        : 'Akademik Kurul Uyarısı: Literatür Nüansı Tespit Edildi'),
    detailedReview: parsed.detailedReview || 'Soru kanonik textbook referansları ile tutarlıdır.',
    editionNotes: parsed.editionNotes || 'Güncel textbook baskıları arasında çelişki bulunmamaktadır.',
    checkedAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  };
}

// ============================================================================
// 4. ANA UYGULAMA BİLEŞENİ
// ============================================================================

export default function App() {
  // Tema & Görünüm Durumları
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'exam' | 'notebook' | 'analytics'>('exam');

  // API Ayarları Durumları
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.API_KEY) || '');
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.MODEL) || 'gemini-2.5-flash'
  );
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [tempModel, setTempModel] = useState<string>('gemini-2.5-flash');
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Kalıcı Soru Havuzu (localStorage) - İlk açılışta 4 kanonik örnek soru ile başlar
  const [questionBank, setQuestionBank] = useState<DUSQuestion[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BANK);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore corrupted storage
    }
    return SAMPLE_QUESTIONS;
  });

  // Bildirim (Toast) Mesajı
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Soru Üretim Form Parametreleri
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('protetik');
  const [subtopic, setSubtopic] = useState<string>('');
  const [strictSubtopicLock, setStrictSubtopicLock] = useState<boolean>(true);
  const [questionType, setQuestionType] = useState<string>('Karma (Gerçek Sınav Dağılımı)');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Standart DUS');
  const [examMode, setExamMode] = useState<'study' | 'exam'>('study');
  const [timerPreference, setTimerPreference] = useState<'stopwatch' | 'countdown' | 'untimed'>('stopwatch');

  // Yükleme & Denetim Durumları
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [auditingQuestionId, setAuditingQuestionId] = useState<string | null>(null);

  // Kopyala-Yapıştır AI Köprüsü (API'siz Mod) Durumları
  const [generationMode, setGenerationMode] = useState<'bridge' | 'api'>(() =>
    localStorage.getItem(STORAGE_KEYS.API_KEY) ? 'api' : 'bridge'
  );
  const [bridgeCopied, setBridgeCopied] = useState<boolean>(false);
  const [showBridgePromptPreview, setShowBridgePromptPreview] = useState<boolean>(false);
  const [bridgeJsonInput, setBridgeJsonInput] = useState<string>('');
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  // API'siz Denetçi Köprüsü Durumları
  const [bridgeAuditOpenId, setBridgeAuditOpenId] = useState<string | null>(null);
  const [bridgeAuditCopiedId, setBridgeAuditCopiedId] = useState<string | null>(null);
  const [bridgeAuditJsonInput, setBridgeAuditJsonInput] = useState<string>('');

  // Görsel Soru Üretimi & Manuel Görsel Soru Ekleme Durumları
  const [attachedReferenceImage, setAttachedReferenceImage] = useState<{
    dataUrl: string;
    base64Data: string;
    mimeType: string;
    caption: string;
  } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualSubjectId, setManualSubjectId] = useState<string>('radyoloji');
  const [manualSubtopic, setManualSubtopic] = useState<string>('');
  const [manualStem, setManualStem] = useState<string>('');
  const [manualImageUrl, setManualImageUrl] = useState<string>('');
  const [manualImageCaption, setManualImageCaption] = useState<string>('');
  const [manualOptions, setManualOptions] = useState<QuestionOptions>({
    A: '',
    B: '',
    C: '',
    D: '',
    E: ''
  });
  const [manualCorrect, setManualCorrect] = useState<OptionKey>('A');
  const [manualReference, setManualReference] = useState<string>('');
  const [manualExplanation, setManualExplanation] = useState<string>('');

  // Aktif Sınav Oturumu
  const [session, setSession] = useState<ExamAttemptSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Yanlış Defteri & Kaydedilenler Filtreleri
  const [notebookFilterType, setNotebookFilterType] = useState<'all' | 'due' | 'wrong' | 'favorites'>('all');
  const [notebookSubjectFilter, setNotebookSubjectFilter] = useState<string>('all');
  const [expandedNotebookIds, setExpandedNotebookIds] = useState<Record<string, boolean>>({});

  // Mobil Uygulama (PWA) Kurulum ve Kaydırma (Swipe) Durumları
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandaloneApp, setIsStandaloneApp] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mobil PWA Manifest, Meta Etiketleri ve Ana Ekrana Ekleme Desteği
  useEffect(() => {
    const standalone =
      Capacitor.isNativePlatform() ||
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandaloneApp(standalone);

    // Mobil tam ekran ve durum çubuğu meta etiketlerini enjekte et
    const ensureMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    ensureMeta('apple-mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    ensureMeta('apple-mobile-web-app-title', 'DUS Akademi');
    ensureMeta('mobile-web-app-capable', 'yes');
    ensureMeta('theme-color', darkMode ? '#020617' : '#0d9488');

    // Android Chrome WebAPK kurulumu için gerçek 192x192 ve 512x512 PNG ikonlar üret (SVG ikonlar Chrome'da reddedilir)
    const createPngIcon = (size: number): string => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, '#0d9488');
        grad.addColorStop(1, '#0e7490');
        ctx.fillStyle = grad;
        const r = size * 0.22;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(size - r, 0);
        ctx.quadraticCurveTo(size, 0, size, r);
        ctx.lineTo(size, size - r);
        ctx.quadraticCurveTo(size, size, size - r, size);
        ctx.lineTo(r, size);
        ctx.quadraticCurveTo(0, size, 0, size - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${Math.round(size * 0.34)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DUS', size / 2, size * 0.52);
      }
      return canvas.toDataURL('image/png');
    };

    const icon192 = createPngIcon(192);
    const icon512 = createPngIcon(512);

    // Chrome'un blob: manifest kısıtlamasını aşmak için data:application/manifest+json kullan
    const manifestObj = {
      name: 'DUS Akademi Pro',
      short_name: 'DUS Akademi',
      description: 'ÖSYM Formatında Diş Hekimliğinde Uzmanlık Sınavı Soru Bankası',
      start_url: window.location.pathname || '/',
      scope: '/',
      display: 'standalone',
      background_color: darkMode ? '#020617' : '#f8fafc',
      theme_color: '#0d9488',
      orientation: 'portrait-primary',
      icons: [
        {
          src: icon192,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: icon512,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    const manifestDataUrl = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(manifestObj)
    )}`;
    let linkTag = document.querySelector('link[rel="manifest"]');
    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.setAttribute('rel', 'manifest');
      document.head.appendChild(linkTag);
    }
    linkTag.setAttribute('href', manifestDataUrl);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [darkMode]);

  const handleInstallPwaClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        showToast('success', 'DUS Akademi Pro ana ekranınıza uygulama olarak eklendi!');
        setDeferredPrompt(null);
      }
    } else {
      setIsPwaModalOpen(true);
    }
  };

  // Dokunmatik Ekranlarda Sağa/Sola Kaydırarak (Swipe) Sorular Arası Geçiş
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || !session) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Yatay kaydırma dikey kaydırmadan belirgin şekilde büyükse soruyu değiştir
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0 && currentIndex < syncedSessionQuestions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (dx > 0 && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    }
  };

  // Tema senkronizasyonu
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Soru havuzu localStorage kaydı
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BANK, JSON.stringify(questionBank));
    } catch {
      showToast('error', 'Tarayıcı depolama alanı dolu olabilir. JSON yedeği almanız önerilir.');
    }
  }, [questionBank]);

  // Kronometre / Geri Sayım Sayacı
  useEffect(() => {
    if (!session || session.isSubmitted || session.timerMode === 'untimed') return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (session.timerMode === 'countdown' && next >= session.initialDurationSec) {
          clearInterval(interval);
          handleSubmitExam(true);
          return session.initialDurationSec;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.startedAt, session?.isSubmitted, session?.timerMode]);

  // API Ayarları Modalını Açma & Kaydetme
  const openApiSettings = () => {
    setTempApiKey(apiKey);
    setTempModel(selectedModel);
    setConnectionTestResult(null);
    setIsApiModalOpen(true);
  };

  const saveApiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedKey = tempApiKey.trim();
    setApiKey(cleanedKey);
    setSelectedModel(tempModel);
    localStorage.setItem(STORAGE_KEYS.API_KEY, cleanedKey);
    localStorage.setItem(STORAGE_KEYS.MODEL, tempModel);
    if (cleanedKey) {
      setGenerationMode('api');
    }
    setIsApiModalOpen(false);
    showToast('success', 'Gemini API ayarları tarayıcınıza kaydedildi.');
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    const res = await testGeminiConnection(tempApiKey, tempModel);
    setConnectionTestResult(res);
    setIsTestingConnection(false);
  };

  // JSON Dışa Aktar (Export) & İçe Aktar (Import)
  const handleExportJson = async () => {
    try {
      const payload = {
        app: 'DUS Akademi Pro',
        exportedAt: new Date().toISOString(),
        totalQuestions: questionBank.length,
        questions: questionBank
      };
      const fileName = `dus-soru-havuzu-${new Date().toISOString().slice(0, 10)}.json`;

      // Android uygulamasında <a download> çalışmaz: dosyayı yazıp paylaşım menüsünü aç
      if (Capacitor.isNativePlatform()) {
        const written = await Filesystem.writeFile({
          path: fileName,
          data: JSON.stringify(payload, null, 2),
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        await CapacitorShare.share({
          title: 'DUS soru havuzu yedeği',
          files: [written.uri],
          dialogTitle: 'Yedeği kaydet veya paylaş'
        });
        showToast('success', `${questionBank.length} soruluk yedek hazırlandı.`);
        return;
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', `${questionBank.length} soruluk veri havuzu JSON olarak indirildi.`);
    } catch {
      showToast('error', 'JSON dışa aktarma sırasında bir hata oluştu.');
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        const importedList: DUSQuestion[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.questions)
          ? parsed.questions
          : [];

        if (importedList.length === 0) {
          throw new Error('Dosya içinde geçerli soru kaydı bulunamadı.');
        }

        setQuestionBank((prev) => {
          const existingIds = new Set(prev.map((q) => q.id));
          const uniqueIncoming = importedList.filter((q) => q && q.id && !existingIds.has(q.id));
          return [...uniqueIncoming, ...prev];
        });
        showToast('success', `${importedList.length} soru başarıyla içe aktarıldı.`);
      } catch (err: any) {
        showToast('error', err?.message || 'Geçersiz JSON dosyası.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Görsel Dosyası Yükleme (AI Üretimi veya Manuel Soru Ekleme İçin)
  const handleSelectReferenceImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'ai' | 'manual'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 960, 0.8);
      if (target === 'ai') {
        setAttachedReferenceImage({
          ...compressed,
          caption: ''
        });
        showToast('success', 'Vaka/Radyografi görseli eklendi! Artık görsele dayalı DUS soruları üretebilirsiniz.');
      } else {
        setManualImageUrl(compressed.dataUrl);
        showToast('success', 'Görsel soru kartına başarıyla eklendi.');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Görsel yüklenirken hata oluştu.');
    }
    e.target.value = '';
  };

  // Manuel Görsel / Klasik DUS Sorusu Kaydetme
  const handleSaveManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStem.trim()) {
      showToast('error', 'Lütfen soru kökü metnini girin.');
      return;
    }
    const letters: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];
    for (const k of letters) {
      if (!manualOptions[k].trim()) {
        showToast('error', `Lütfen ${k} şıkkını doldurun.`);
        return;
      }
    }

    const subjObj = SUBJECTS.find((s) => s.id === manualSubjectId) || SUBJECTS[0];
    const newQuestion: DUSQuestion = {
      id: `dus-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subjectId: subjObj.id,
      subject: subjObj.name,
      category: subjObj.category,
      subtopic: manualSubtopic.trim() || undefined,
      questionType: manualImageUrl ? 'Görsel / Radyografik Vaka Sorusu' : 'Klinik Vaka Senaryosu',
      difficulty: 'Seçici (Eleyici) DUS',
      stem: manualStem.trim(),
      premises: [],
      imageUrl: manualImageUrl || undefined,
      imageCaption: manualImageCaption.trim() || undefined,
      options: {
        A: manualOptions.A.trim(),
        B: manualOptions.B.trim(),
        C: manualOptions.C.trim(),
        D: manualOptions.D.trim(),
        E: manualOptions.E.trim()
      },
      correctAnswer: manualCorrect,
      textbookReference: manualReference.trim() || subjObj.textbooks,
      mechanismExplanation:
        manualExplanation.trim() || 'Kullanıcı tarafından eklenen görsel/vaka sorusu.',
      distractorExplanations: {
        A: manualCorrect === 'A' ? 'Doğru seçenektir.' : 'Klinik/radyografik bulgularla uyumlu değildir.',
        B: manualCorrect === 'B' ? 'Doğru seçenektir.' : 'Klinik/radyografik bulgularla uyumlu değildir.',
        C: manualCorrect === 'C' ? 'Doğru seçenektir.' : 'Klinik/radyografik bulgularla uyumlu değildir.',
        D: manualCorrect === 'D' ? 'Doğru seçenektir.' : 'Klinik/radyografik bulgularla uyumlu değildir.',
        E: manualCorrect === 'E' ? 'Doğru seçenektir.' : 'Klinik/radyografik bulgularla uyumlu değildir.'
      },
      createdAt: new Date().toISOString(),
      isFavorite: true
    };

    setQuestionBank((prev) => [newQuestion, ...prev]);
    setIsManualModalOpen(false);
    setManualStem('');
    setManualImageUrl('');
    setManualImageCaption('');
    setManualOptions({ A: '', B: '', C: '', D: '', E: '' });
    setManualReference('');
    setManualExplanation('');

    // İsterse hemen tek soruluk pratik olarak aç
    setSession({
      questions: [newQuestion],
      userAnswers: {},
      eliminatedOptions: {},
      mode: 'study',
      isSubmitted: false,
      startedAt: Date.now(),
      timerMode: 'untimed',
      initialDurationSec: 75
    });
    setCurrentIndex(0);
    setActiveTab('exam');
    setMobileDrawerOpen(false);
    showToast('success', 'Görsel DUS sorunuz kaydedildi ve önizleme için açıldı!');
  };

  // Yeni Sınav Başlatma (Gerçek Gemini API Çağrısı)
  const handleGenerateExam = async () => {
    if (!apiKey.trim()) {
      openApiSettings();
      showToast('info', 'Özgün soru üretmek için lütfen Google Gemini API anahtarınızı yapıştırıp kaydedin.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateQuestionsFromGemini({
        apiKey,
        model: selectedModel,
        selectedSubjectId,
        subtopic,
        strictSubtopicLock,
        questionType,
        count: questionCount,
        difficulty,
        referenceImage: attachedReferenceImage,
        getAvoidStems: (subjectIds) =>
          collectAvoidStems(questionBank, subjectIds, subtopic, subjectIds.length > 1 ? 30 : 25)
      });
      const generatedQuestions = result.questions;
      const notes: string[] = [];
      if (result.dropped > 0) notes.push(`${result.dropped} hatalı soru elendi`);
      if (result.failedRequests > 0) notes.push(`bir kısım üretilemedi: ${result.lastError}`);

      setQuestionBank((prev) => [...generatedQuestions, ...prev]);

      // DUS standart süre: soru başına 1.25 dakika (75 saniye)
      const durationSec = generatedQuestions.length * 75;
      setSession({
        questions: generatedQuestions,
        userAnswers: {},
        eliminatedOptions: {},
        mode: examMode,
        isSubmitted: false,
        startedAt: Date.now(),
        timerMode: timerPreference,
        initialDurationSec: durationSec
      });
      setCurrentIndex(0);
      setElapsedSeconds(0);
      setActiveTab('exam');
      setMobileDrawerOpen(false);
      showToast(
        notes.length > 0 ? 'info' : 'success',
        `${generatedQuestions.length} adet DUS sorusu üretildi${notes.length > 0 ? ` (${notes.join('; ')})` : ''}.`
      );
    } catch (err: any) {
      showToast('error', err.message || 'Soru üretilirken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Kopyala-Yapıştır AI Köprüsü: Dinamik Komut Önizlemesi
  const currentBridgePrompt = useMemo(() => {
    const isKarma = selectedSubjectId === 'karma_all';
    const subjectPlan = isKarma ? buildKarmaSubjectPlan(questionCount) : undefined;
    const subjectIds = subjectPlan ? [...new Set(subjectPlan)] : [selectedSubjectId];
    return buildBridgeGenerationPrompt({
      selectedSubjectId,
      subtopic,
      strictSubtopicLock,
      questionType,
      count: questionCount,
      difficulty,
      subjectPlan,
      hasImage: Boolean(attachedReferenceImage),
      avoidStems: collectAvoidStems(questionBank, subjectIds, subtopic, isKarma ? 30 : 25)
    });
    // questionBank yalnızca soru sayısı değişince yeniden hesaplansın (her cevapta değil)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedSubjectId,
    subtopic,
    strictSubtopicLock,
    questionType,
    questionCount,
    difficulty,
    attachedReferenceImage,
    questionBank.length
  ]);

  // Adım 2: Komutu Kopyala
  const handleCopyBridgePrompt = async () => {
    const ok = await copyToClipboardSafe(currentBridgePrompt);
    if (ok) {
      setBridgeCopied(true);
      setBridgeError(null);
      showToast(
        'success',
        'Özel DUS komutu panoya kopyalandı! Şimdi ücretsiz Gemini, ChatGPT veya Claude ekranına yapıştırabilirsiniz.'
      );
      setTimeout(() => setBridgeCopied(false), 3500);
    } else {
      setShowBridgePromptPreview(true);
      showToast('info', 'Otomatik kopyalama engellendi; aşağıdaki önizleme kutusundan komutu kopyalayabilirsiniz.');
    }
  };

  // Adım 3: Panodan Yapıştır
  const handlePasteBridgeFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setBridgeJsonInput(text);
        setBridgeError(null);
        showToast('info', 'Panodaki içerik yapıştırıldı.');
      } else {
        showToast('info', 'Panoda metin bulunamadı. Ctrl+V (veya Cmd+V) ile yapıştırabilirsiniz.');
      }
    } catch {
      showToast('info', 'Tarayıcı pano okuma izni vermedi. Lütfen kutuya tıklayıp Ctrl+V ile yapıştırın.');
    }
  };

  // Adım 3: Yapıştırılan JSON'dan Soruları Aktar ve Sınavı Başlat
  const handleImportBridgeQuestions = () => {
    setBridgeError(null);
    try {
      const { questions: importedQuestions, dropped } = extractAndNormalizeBridgeQuestions(bridgeJsonInput, {
        selectedSubjectId,
        subtopic,
        questionType,
        difficulty
      });

      setQuestionBank((prev) => [...importedQuestions, ...prev]);

      const durationSec = importedQuestions.length * 75;
      setSession({
        questions: importedQuestions,
        userAnswers: {},
        eliminatedOptions: {},
        mode: examMode,
        isSubmitted: false,
        startedAt: Date.now(),
        timerMode: timerPreference,
        initialDurationSec: durationSec
      });
      setCurrentIndex(0);
      setElapsedSeconds(0);
      setBridgeJsonInput('');
      setActiveTab('exam');
      setMobileDrawerOpen(false);
      showToast(
        'success',
        `${importedQuestions.length} adet özgün DUS sorusu aktarıldı ve soru havuzunuza kaydedildi${dropped > 0 ? ` (${dropped} hatalı soru elendi)` : ''}!`
      );
    } catch (err: any) {
      const msg = err?.message || 'JSON yanıtı işlenemedi.';
      setBridgeError(msg);
      showToast('error', msg);
    }
  };

  // Bridge modunda görsel eklendiyse aktarılan sorulara otomatik bağla
  const handleImportBridgeQuestionsWithImage = () => {
    setBridgeError(null);
    try {
      const { questions: rawImported, dropped } = extractAndNormalizeBridgeQuestions(bridgeJsonInput, {
        selectedSubjectId,
        subtopic,
        questionType,
        difficulty
      });
      const importedQuestions = rawImported.map((q) =>
        attachedReferenceImage
          ? {
              ...q,
              imageUrl: q.imageUrl || attachedReferenceImage.dataUrl,
              imageCaption:
                q.imageCaption ||
                attachedReferenceImage.caption.trim() ||
                'Klinik / Radyografik Vaka Görseli'
            }
          : q
      );

      setQuestionBank((prev) => [...importedQuestions, ...prev]);

      const durationSec = importedQuestions.length * 75;
      setSession({
        questions: importedQuestions,
        userAnswers: {},
        eliminatedOptions: {},
        mode: examMode,
        isSubmitted: false,
        startedAt: Date.now(),
        timerMode: timerPreference,
        initialDurationSec: durationSec
      });
      setCurrentIndex(0);
      setElapsedSeconds(0);
      setBridgeJsonInput('');
      setActiveTab('exam');
      setMobileDrawerOpen(false);
      showToast(
        'success',
        `${importedQuestions.length} adet özgün DUS sorusu aktarıldı ve soru havuzunuza kaydedildi${dropped > 0 ? ` (${dropped} hatalı soru elendi)` : ''}!`
      );
    } catch (err: any) {
      const msg = err?.message || 'JSON yanıtı işlenemedi.';
      setBridgeError(msg);
      showToast('error', msg);
    }
  };

  // API'siz Denetçi Modu: Denetim Komutunu Kopyala
  const handleCopyBridgeAuditPrompt = async (question: DUSQuestion) => {
    const promptText = buildBridgeAuditPrompt(question);
    const ok = await copyToClipboardSafe(promptText);
    setBridgeAuditOpenId(question.id);
    setBridgeAuditJsonInput('');
    if (ok) {
      setBridgeAuditCopiedId(question.id);
      showToast('success', 'Akademik denetim komutu kopyalandı! Ücretsiz AI sohbetine yapıştırıp JSON cevabını aşağıya girin.');
      setTimeout(() => setBridgeAuditCopiedId(null), 3500);
    } else {
      showToast('info', 'Denetim kutusu açıldı; komutu AI sohbetine yapıştırıp yanıtı buraya aktarın.');
    }
  };

  // API'siz Denetçi Modu: Denetim Yanıtını Kaydet
  const handleApplyBridgeAudit = (question: DUSQuestion) => {
    try {
      const result = extractAndNormalizeBridgeAudit(bridgeAuditJsonInput);
      setQuestionBank((prev) =>
        prev.map((q) => (q.id === question.id ? { ...q, auditResult: result } : q))
      );
      if (session) {
        setSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === question.id ? { ...q, auditResult: result } : q
            )
          };
        });
      }
      setBridgeAuditOpenId(null);
      setBridgeAuditJsonInput('');
      showToast('success', 'Akademik kurul denetim raporu başarıyla işlendi.');
    } catch (err: any) {
      showToast('error', err?.message || 'Denetim JSON yanıtı ayrıştırılamadı.');
    }
  };

  // Örnek Kanonik Test Başlatma (API Anahtarı Olmadan)
  const handleStartSampleExam = () => {
    const clonedSamples = SAMPLE_QUESTIONS.map((sq) => {
      const existing = questionBank.find((b) => b.id === sq.id);
      return existing ? { ...sq, ...existing } : { ...sq };
    });

    setQuestionBank((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      const missing = clonedSamples.filter((s) => !existingIds.has(s.id));
      return missing.length > 0 ? [...missing, ...prev] : prev;
    });

    setSession({
      questions: clonedSamples,
      userAnswers: {},
      eliminatedOptions: {},
      mode: examMode,
      isSubmitted: false,
      startedAt: Date.now(),
      timerMode: timerPreference,
      initialDurationSec: clonedSamples.length * 75
    });
    setCurrentIndex(0);
    setElapsedSeconds(0);
    setActiveTab('exam');
    setMobileDrawerOpen(false);
    showToast('info', '4 soruluk Örnek Kanonik DUS Denemesi başlatıldı (2 Klinik + 2 Temel Bilimler).');
  };

  // Telafi Testi Başlatma (Yanlış Defteri / Favorilerden)
  const handleStartRemedialExam = (questionsToPractice: DUSQuestion[]) => {
    if (questionsToPractice.length === 0) {
      showToast('info', 'Telafi testi için seçili filtrede soru bulunmuyor.');
      return;
    }

    const subset = questionsToPractice.slice(0, 20);
    setSession({
      questions: subset,
      userAnswers: {},
      eliminatedOptions: {},
      mode: 'study',
      isSubmitted: false,
      startedAt: Date.now(),
      timerMode: 'stopwatch',
      initialDurationSec: subset.length * 75
    });
    setCurrentIndex(0);
    setElapsedSeconds(0);
    setActiveTab('exam');
    showToast('success', `${subset.length} soruluk Telafi Testi başlatıldı.`);
  };

  // Soru İstatistiklerini Güncelle
  const recordQuestionAttempt = (question: DUSQuestion, chosenOption: OptionKey) => {
    const isCorrect = chosenOption === question.correctAnswer;

    setQuestionBank((prev) =>
      prev.map((q) => {
        if (q.id !== question.id) return q;
        const now = Date.now();
        const base = {
          ...q,
          lastUserAnswer: chosenOption,
          attemptsCount: (q.attemptsCount || 0) + 1,
          correctCount: (q.correctCount || 0) + (isCorrect ? 1 : 0)
        };

        // Yanlış: deftere gir / başa dön, yarın tekrar sorulsun
        if (!isCorrect) {
          return {
            ...base,
            isWrongPreviously: true,
            reviewStage: 0,
            nextReviewAt: new Date(now + REVIEW_INTERVAL_DAYS[0] * DAY_MS).toISOString()
          };
        }

        // Defterde olmayan soruyu doğru yapmak hiçbir şeyi değiştirmez
        if (!q.isWrongPreviously) return base;

        // Vadesi gelmeden doğru yapmak (aynı gün tekrar çözmek) aşama atlatmaz
        if (!isReviewDue(q, now)) return base;

        const stage = (q.reviewStage || 0) + 1;
        if (stage >= REVIEW_INTERVAL_DAYS.length) {
          // 1-3-7-21 gün tekrarlarının hepsi doğru: öğrenildi
          return { ...base, isWrongPreviously: false, reviewStage: stage, nextReviewAt: undefined };
        }
        return {
          ...base,
          isWrongPreviously: true,
          reviewStage: stage,
          nextReviewAt: new Date(now + REVIEW_INTERVAL_DAYS[stage] * DAY_MS).toISOString()
        };
      })
    );
  };

  // Şık İşaretleme
  const handleSelectOption = (question: DUSQuestion, opt: OptionKey) => {
    if (!session) return;
    if (session.isSubmitted) return;
    if (session.mode === 'study' && session.userAnswers[question.id]) return;

    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        userAnswers: {
          ...prev.userAnswers,
          [question.id]: opt
        }
      };
    });

    if (session.mode === 'study') {
      recordQuestionAttempt(question, opt);
    }
  };

  // Şıkkın Üstünü Çizme (Eleme)
  const handleToggleEliminate = (e: React.MouseEvent, questionId: string, opt: OptionKey) => {
    e.stopPropagation();
    if (!session || session.isSubmitted) return;

    setSession((prev) => {
      if (!prev) return null;
      const currentList = prev.eliminatedOptions[questionId] || [];
      const exists = currentList.includes(opt);
      const updated = exists ? currentList.filter((o) => o !== opt) : [...currentList, opt];
      return {
        ...prev,
        eliminatedOptions: {
          ...prev.eliminatedOptions,
          [questionId]: updated
        }
      };
    });
  };

  // Deneme Modunda Testi Bitir
  const handleSubmitExam = (autoTimeUp = false) => {
    if (!session || session.isSubmitted) return;

    session.questions.forEach((q) => {
      const ans = session.userAnswers[q.id];
      if (ans) {
        recordQuestionAttempt(q, ans);
      }
    });

    setSession((prev) => (prev ? { ...prev, isSubmitted: true } : null));
    if (autoTimeUp) {
      showToast('info', 'Süre doldu! Sınavınız otomatik olarak sonlandırıldı.');
    } else {
      showToast('success', 'Sınav tamamlandı! Net hesabınızı ve detaylı çözümleri inceleyebilirsiniz.');
    }
  };

  // Aktif Testi Kapatıp Ana Ekrana / Soru Üretme Ekranına Dön
  const handleCloseExamToHome = () => {
    setSession(null);
    setCurrentIndex(0);
    setElapsedSeconds(0);
    setMobileDrawerOpen(false);
    setFocusMode(false);
  };

  // Favorilere Ekle / Çıkar
  const handleToggleFavorite = (questionId: string) => {
    setQuestionBank((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, isFavorite: !q.isFavorite } : q))
    );
    if (session) {
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId ? { ...q, isFavorite: !q.isFavorite } : q
          )
        };
      });
    }
  };

  // Akademik Doğrulama (Denetçi Modu - İkinci Gemini API Çağrısı)
  const handleAuditQuestion = async (question: DUSQuestion) => {
    if (!apiKey.trim()) {
      openApiSettings();
      showToast('info', 'Akademik doğrulama yapabilmek için Gemini API anahtarınızı girmelisiniz.');
      return;
    }

    setAuditingQuestionId(question.id);
    try {
      const result = await auditQuestionWithGemini({
        apiKey,
        model: selectedModel,
        question
      });

      setQuestionBank((prev) =>
        prev.map((q) => (q.id === question.id ? { ...q, auditResult: result } : q))
      );

      if (session) {
        setSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === question.id ? { ...q, auditResult: result } : q
            )
          };
        });
      }

      showToast('success', 'Kıdemli DUS akademisyeni denetimi tamamlandı.');
    } catch (err: any) {
      showToast('error', err.message || 'Doğrulama sırasında hata oluştu.');
    } finally {
      setAuditingQuestionId(null);
    }
  };

  // ============================================================================
  const matchesSubjectId = (questionSubjId: string, targetSubjId: string): boolean => {
    if (questionSubjId === targetSubjId) return true;
    if (
      targetSubjId === 'fizyoloji_histoloji' &&
      (questionSubjId === 'fizyoloji' || questionSubjId === 'histoloji')
    ) {
      return true;
    }
    if (
      targetSubjId === 'farmakoloji_genetik' &&
      (questionSubjId === 'farmakoloji' || questionSubjId === 'genetik')
    ) {
      return true;
    }
    if (
      (targetSubjId === 'pedodonti' || targetSubjId === 'ortodonti') &&
      questionSubjId === 'pedodonti_ortodonti'
    ) {
      return true;
    }
    return false;
  };

  const notebookQuestions = useMemo(() => {
    const now = Date.now();
    const filtered = questionBank.filter((q) => {
      const matchesType =
        notebookFilterType === 'all'
          ? q.isWrongPreviously || q.isFavorite
          : notebookFilterType === 'due'
          ? isReviewDue(q, now)
          : notebookFilterType === 'wrong'
          ? Boolean(q.isWrongPreviously)
          : Boolean(q.isFavorite);

      const matchesSubject =
        notebookSubjectFilter === 'all'
          ? true
          : matchesSubjectId(q.subjectId, notebookSubjectFilter);

      return matchesType && matchesSubject;
    });
    // Tekrar zamanı gelenler en üstte, sonra en yakın tekrar tarihine göre
    const dueTime = (q: DUSQuestion) =>
      !q.isWrongPreviously ? Number.MAX_SAFE_INTEGER : isReviewDue(q, now) ? 0 : Date.parse(q.nextReviewAt || '') || 0;
    return [...filtered].sort((a, b) => dueTime(a) - dueTime(b));
  }, [questionBank, notebookFilterType, notebookSubjectFilter]);

  const analyticsData = useMemo(() => {
    let totalAttempts = 0;
    let totalCorrect = 0;
    let klinikAttempts = 0;
    let klinikCorrect = 0;
    let temelAttempts = 0;
    let temelCorrect = 0;

    const perSubject = SUBJECTS.map((subj) => {
      const subjQuestions = questionBank.filter((q) => matchesSubjectId(q.subjectId, subj.id));
      const attempts = subjQuestions.reduce((acc, q) => acc + (q.attemptsCount || 0), 0);
      const correct = subjQuestions.reduce((acc, q) => acc + (q.correctCount || 0), 0);
      const wrong = Math.max(0, attempts - correct);
      const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      const net = Number((correct - wrong * 0.25).toFixed(2));

      totalAttempts += attempts;
      totalCorrect += correct;
      if (subj.category === 'Klinik Bilimler') {
        klinikAttempts += attempts;
        klinikCorrect += correct;
      } else {
        temelAttempts += attempts;
        temelCorrect += correct;
      }

      return {
        ...subj,
        totalGenerated: subjQuestions.length,
        attempts,
        correct,
        wrong,
        accuracy,
        net
      };
    });

    const totalWrong = Math.max(0, totalAttempts - totalCorrect);
    const totalNet = Number((totalCorrect - totalWrong * 0.25).toFixed(2));
    const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const klinikAccuracy = klinikAttempts > 0 ? Math.round((klinikCorrect / klinikAttempts) * 100) : 0;
    const temelAccuracy = temelAttempts > 0 ? Math.round((temelCorrect / temelAttempts) * 100) : 0;
    const wrongBookCount = questionBank.filter((q) => q.isWrongPreviously).length;
    const dueReviewCount = questionBank.filter((q) => isReviewDue(q)).length;
    const favoriteCount = questionBank.filter((q) => q.isFavorite).length;

    // En güçlü ve gelişime açık dersler
    const attemptedSubjects = perSubject.filter((s) => s.attempts > 0);
    const strongestSubject = [...attemptedSubjects].sort((a, b) => b.accuracy - a.accuracy)[0] || null;
    const weakestSubject = [...attemptedSubjects].sort((a, b) => a.accuracy - b.accuracy)[0] || null;

    return {
      totalGenerated: questionBank.length,
      totalAttempts,
      totalCorrect,
      totalWrong,
      totalNet,
      overallAccuracy,
      klinikAttempts,
      klinikCorrect,
      klinikAccuracy,
      temelAttempts,
      temelCorrect,
      temelAccuracy,
      wrongBookCount,
      dueReviewCount,
      favoriteCount,
      perSubject,
      strongestSubject,
      weakestSubject
    };
  }, [questionBank]);

  // Aktif sınav oturumundaki soruları ana havuzdaki (favori, denetim sonucu vb.) güncellemelerle senkronize tut
  const syncedSessionQuestions = useMemo(() => {
    if (!session) return [];
    return session.questions.map((sq) => questionBank.find((bq) => bq.id === sq.id) || sq);
  }, [session, questionBank]);

  const currentQuestion = syncedSessionQuestions[currentIndex] || null;

  const isCurrentSolutionVisible = useMemo(() => {
    if (!session || !currentQuestion) return false;
    if (session.isSubmitted) return true;
    if (session.mode === 'study' && session.userAnswers[currentQuestion.id]) return true;
    return false;
  }, [session, currentQuestion]);

  // ============================================================================
  // 6. ARAYÜZ RENDER
  // ============================================================================

  return (
    <div
      className={`min-h-screen pb-20 lg:pb-6 transition-colors duration-200 font-sans select-none sm:select-auto ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* TOAST BİLDİRİMİ (MOBİL ALT BAR ÜSTÜNDE KONUMLANDIRILDI) */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-5 left-4 right-4 sm:left-auto sm:right-5 z-50 sm:max-w-md animate-fade-in">
          <div
            className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${
              toast.type === 'success'
                ? darkMode
                  ? 'bg-emerald-950/95 border-emerald-700 text-emerald-100'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : toast.type === 'error'
                ? darkMode
                  ? 'bg-rose-950/95 border-rose-700 text-rose-100'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
                : darkMode
                ? 'bg-slate-900/95 border-teal-700 text-slate-100'
                : 'bg-white border-teal-200 text-slate-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />}
            <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ÜST BAŞLIK ÇUBUĞU (ODAK MODUNDA GİZLENİR) */}
      {!focusMode && (
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-md pt-[env(safe-area-inset-top)] ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
          }`}
        >
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
            {/* Logo ve Başlık */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-md shadow-teal-600/20 shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="font-bold text-sm sm:text-lg tracking-tight">
                    DUS Akademi <span className="text-teal-600 dark:text-teal-400">Pro</span>
                  </h1>
                  {!isStandaloneApp && (
                    <button
                      onClick={handleInstallPwaClick}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-600 text-white shadow-sm hover:bg-teal-500 transition-colors"
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>Uygulamayı Yükle</span>
                    </button>
                  )}
                </div>
                <p className={`text-xs hidden sm:block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  ÖSYM Formatında Kanıta Dayalı Uzmanlık Sınavı Hazırlık Platformu
                </p>
              </div>
            </div>

            {/* Ana Sekmeler (Masaüstü) */}
            <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
              <button
                onClick={() => setActiveTab('exam')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'exam'
                    ? darkMode
                      ? 'bg-slate-900 text-teal-400 shadow-sm'
                      : 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Soru Üret & Çöz
              </button>

              <button
                onClick={() => setActiveTab('notebook')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'notebook'
                    ? darkMode
                      ? 'bg-slate-900 text-teal-400 shadow-sm'
                      : 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                Yanlış Defteri & Kaydedilenler
                {(analyticsData.wrongBookCount > 0 || analyticsData.favoriteCount > 0) && (
                  <span className="ml-1 px-1.5 py-0.2 text-xs rounded-full bg-teal-600 text-white">
                    {analyticsData.wrongBookCount + analyticsData.favoriteCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'analytics'
                    ? darkMode
                      ? 'bg-slate-900 text-teal-400 shadow-sm'
                      : 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Performans Analizi
              </button>
            </nav>

            {/* Sağ Kontroller: Export/Import, Odak Modu, Tema, API Ayarları */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handleExportJson}
                title="Soru Havuzunu JSON Olarak Dışa Aktar"
                className={`p-2 rounded-lg border text-xs font-medium transition-colors hidden sm:flex items-center gap-1.5 ${
                  darkMode
                    ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Download className="w-4 h-4" />
                <span className="hidden xl:inline">Dışa Aktar</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                title="JSON Yedeğinden İçe Aktar"
                className={`p-2 rounded-lg border text-xs font-medium transition-colors hidden sm:flex items-center gap-1.5 ${
                  darkMode
                    ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden xl:inline">İçe Aktar</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />

              <button
                onClick={() => setFocusMode(true)}
                title="Odak Modu (Dikkat Dağıtmayan Tam Ekran)"
                className={`p-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
                className={`p-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-amber-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={openApiSettings}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-all ${
                  apiKey
                    ? darkMode
                      ? 'bg-teal-950/70 border-teal-700 text-teal-300 hover:bg-teal-900/70'
                      : 'bg-teal-50 border-teal-300 text-teal-800 hover:bg-teal-100'
                    : darkMode
                    ? 'bg-amber-950/60 border-amber-700 text-amber-300 hover:bg-amber-900/60'
                    : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">API Ayarları</span>
                <span
                  className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
                />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ODAK MODU ÇIKIŞ ÇUBUĞU */}
      {focusMode && (
        <div
          className={`sticky top-0 z-30 border-b px-4 py-2 flex items-center justify-between ${
            darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
            <Compass className="w-4 h-4" />
            <span>ODAK MODU AKTİF — DİKKAT DAĞITMAYAN SINAV ORTAMI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setFocusMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white dark:bg-slate-700 hover:opacity-90"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              Odak Modundan Çık
            </button>
          </div>
        </div>
      )}

      {/* ANA İÇERİK ALANI */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
        {/* ====================================================================
            SEKME 1: SORU ÜRET & ÇÖZ
        ==================================================================== */}
        {activeTab === 'exam' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* MOBİLDE AKTİF SINAV VARKEN TEST OLUŞTURMA PANELİNİ AÇ/KAPAT BUTONU */}
            {!focusMode && session && (
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen((v) => !v)}
                  className={`w-full py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-between shadow-sm ${
                    darkMode
                      ? 'bg-slate-900 border-slate-800 text-teal-300'
                      : 'bg-white border-slate-200 text-teal-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    Yeni DUS Testi Oluştur / AI Köprüsü Paneli
                  </span>
                  {mobileDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* SOL KONTROL PANELİ (ODAK MODUNDA GİZLENİR; MOBİLDE SINAV AKTİFSE AÇILIR/KAPANIR) */}
            {!focusMode && (!session || mobileDrawerOpen || typeof window === 'undefined') && (
              <aside
                className={`lg:col-span-4 rounded-2xl border p-4 sm:p-5 shadow-sm ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <h2 className="font-bold text-base">Yeni DUS Testi Oluştur</h2>
                  </div>
                </div>

                {/* ÜRETİM MODU SEÇİCİ: API'SİZ KÖPRÜ vs DOĞRUDAN GEMINI API */}
                <div
                  className={`grid grid-cols-2 gap-1 p-1 rounded-xl mb-4 border ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setGenerationMode('bridge')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      generationMode === 'bridge'
                        ? darkMode
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-white text-teal-800 shadow-sm'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>API&apos;siz Köprü (Ücretsiz)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenerationMode('api')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      generationMode === 'api'
                        ? darkMode
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-white text-teal-800 shadow-sm'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Doğrudan Gemini API</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Alan ve Ders Seçimi */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      Alan ve Ders Seçimi
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        darkMode
                          ? 'bg-slate-950 border-slate-700 text-slate-100'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="karma_all">★ Karma DUS Denemesi (14 Ders)</option>
                      <optgroup label="Klinik Bilimler (8 Ders)">
                        {SUBJECTS.filter((s) => s.category === 'Klinik Bilimler').map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Temel Bilimler (6 Ders)">
                        {SUBJECTS.filter((s) => s.category === 'Temel Bilimler').map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Alt Konu / Odak */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider opacity-80">
                        Alt Konu / Odak <span className="lowercase font-normal opacity-70">(isteğe bağlı)</span>
                      </label>
                      {subtopic.trim() && (
                        <button
                          type="button"
                          onClick={() => setSubtopic('')}
                          className="text-[11px] font-semibold text-rose-500 hover:underline"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={subtopic}
                      onChange={(e) => setSubtopic(e.target.value)}
                      placeholder="Örn: Oklüzyon ve TME (Okeson), Fasiyal sinir dalları..."
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        darkMode
                          ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-600'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />

                    {/* Seçili Derse Özel Hızlı Alt Konu Etiketleri */}
                    {selectedSubjectId !== 'karma_all' && QUICK_SUBTOPICS[selectedSubjectId] && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {QUICK_SUBTOPICS[selectedSubjectId].map((topicChip) => {
                          const isSelectedChip = subtopic === topicChip;
                          return (
                            <button
                              key={topicChip}
                              type="button"
                              onClick={() => setSubtopic(isSelectedChip ? '' : topicChip)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-all text-left ${
                                isSelectedChip
                                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                  : darkMode
                                  ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-teal-600/60'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-teal-500'
                              }`}
                            >
                              {topicChip}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Kesin Alt Konu Kilidi Anahtarı */}
                    {subtopic.trim() && (
                      <label
                        className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer select-none ${
                          strictSubtopicLock
                            ? darkMode
                              ? 'bg-teal-950/40 border-teal-700/70 text-teal-200'
                              : 'bg-teal-50 border-teal-300 text-teal-900'
                            : darkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="text-[11px] leading-snug">
                          <span className="font-bold block">🔒 Kesin Alt Konu Kilidi Aktif</span>
                          <span className="opacity-80">
                            Yapay zekanın dersin diğer konularına kaymasını engeller.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={strictSubtopicLock}
                          onChange={(e) => setStrictSubtopicLock(e.target.checked)}
                          className="w-4 h-4 accent-teal-600 rounded shrink-0"
                        />
                      </label>
                    )}
                  </div>

                  {/* Soru Tipi */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      Soru Kurgusu / Tipi
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        darkMode
                          ? 'bg-slate-950 border-slate-700 text-slate-100'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="Karma (Gerçek Sınav Dağılımı)">Karma (Gerçek Sınav Dağılımı)</option>
                      <option value="Klinik Vaka Senaryosu">Klinik Vaka Senaryosu</option>
                      <option value="Öncüllü Soru (I, II, III)">Öncüllü Soru (I, II, III)</option>
                      <option value="Spot / Sınıflandırma & Kural">Spot / Sınıflandırma &amp; Kural</option>
                      <option value="Görselli Soru (Radyografi / Klinik Vaka)">
                        Görselli Soru (Radyografi / Klinik Vaka)
                      </option>
                    </select>

                    {/* Görselli Soru seçildiğinde hızlı görsel yükleme / manuel ekleme eylem çubuğu */}
                    {questionType.toLowerCase().includes('görselli') && (
                      <div
                        className={`mt-2 p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                          darkMode
                            ? 'bg-indigo-950/35 border-indigo-700/60 text-indigo-200'
                            : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                        }`}
                      >
                        <span className="text-[11px] font-semibold flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Görselli soru modu aktif
                        </span>
                        <div className="flex items-center gap-1.5">
                          <label className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer flex items-center gap-1">
                            <ImagePlus className="w-3 h-3" />
                            <span>{attachedReferenceImage ? 'Görseli Değiştir' : 'Görsel Yükle'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleSelectReferenceImage(e, 'ai')}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsManualModalOpen(true)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                              darkMode
                                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-indigo-500'
                                : 'bg-white border-indigo-200 text-indigo-800 hover:border-indigo-400'
                            }`}
                          >
                            + Manuel Ekle
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Soru Sayısı & Zorluk */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                        Soru Sayısı
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {[5, 10, 20, 40].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setQuestionCount(num)}
                            className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                              questionCount === num
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : darkMode
                                ? 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-teal-500'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                        Zorluk Seviyesi
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className={`w-full rounded-lg border px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          darkMode
                            ? 'bg-slate-950 border-slate-700 text-slate-100'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="Standart DUS">Standart DUS</option>
                        <option value="Seçici (Eleyici) DUS">Seçici (Eleyici)</option>
                      </select>
                    </div>
                  </div>

                  {/* Çözüm Modu & Sayaç Tercihi */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                        Çözüm Modu
                      </label>
                      <select
                        value={examMode}
                        onChange={(e) => setExamMode(e.target.value as 'study' | 'exam')}
                        className={`w-full rounded-lg border px-2.5 py-2 text-xs font-semibold focus:outline-none ${
                          darkMode
                            ? 'bg-slate-950 border-slate-700 text-slate-100'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="study">Anında Çözümü Gör</option>
                        <option value="exam">Bitirince Gör (Deneme)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                        Süre Sayacı
                      </label>
                      <select
                        value={timerPreference}
                        onChange={(e) =>
                          setTimerPreference(e.target.value as 'stopwatch' | 'countdown' | 'untimed')
                        }
                        className={`w-full rounded-lg border px-2.5 py-2 text-xs font-semibold focus:outline-none ${
                          darkMode
                            ? 'bg-slate-950 border-slate-700 text-slate-100'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="stopwatch">Kronometre (İleri)</option>
                        <option value="countdown">Geri Sayım (75 sn/soru)</option>
                        <option value="untimed">Süresiz</option>
                      </select>
                    </div>
                  </div>

                  {/* GÖRSEL SORU ALTYAPISI (RADYOGRAFİ / KLİNİK FOTOĞRAF / HİSTOLOJİ EKLE) */}
                  <div
                    className={`p-3 rounded-xl border space-y-2 ${
                      darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-teal-600" />
                        Vaka / Radyografi Görseli <span className="font-normal opacity-65">(İsteğe Bağlı)</span>
                      </span>
                      <label className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1">
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>{attachedReferenceImage ? 'Değiştir' : 'Görsel Seç'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSelectReferenceImage(e, 'ai')}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {attachedReferenceImage ? (
                      <div className="space-y-2 pt-1">
                        <div className="relative rounded-lg overflow-hidden border border-teal-500/40 bg-black/5">
                          <img
                            src={attachedReferenceImage.dataUrl}
                            alt="Yüklenen vaka görseli"
                            className="w-full max-h-36 object-contain mx-auto"
                          />
                          <button
                            type="button"
                            onClick={() => setAttachedReferenceImage(null)}
                            title="Görseli Kaldır"
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={attachedReferenceImage.caption}
                          onChange={(e) =>
                            setAttachedReferenceImage((prev) =>
                              prev ? { ...prev, caption: e.target.value } : null
                            )
                          }
                          placeholder="Görsel notu (Örn: Panoramik radyografide sol angulus lezyonu)"
                          className={`w-full rounded-lg border px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                            darkMode
                              ? 'bg-slate-900 border-slate-700 text-slate-200'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                        <p className="text-[10px] opacity-70 leading-snug">
                          {generationMode === 'api'
                            ? 'Gemini Vision bu görseli doğrudan analiz ederek görsele dayalı DUS sorusu üretecektir.'
                            : 'Ücretsiz AI sohbetine komutu yapıştırırken bu görseli de sohbete ekleyin; içe aktarıldığında sorulara otomatik bağlanacaktır.'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] opacity-70 leading-snug">
                        Panoramik/CBCT radyografi, klinik fotoğraf veya histoloji kesiti ekleyerek görsel tabanlı DUS soruları oluşturabilirsiniz.
                      </p>
                    )}
                  </div>

                  {/* MOD A: API'SİZ KOPYALA-YAPIŞTIR AI KÖPRÜSÜ */}
                  {generationMode === 'bridge' ? (
                    <div
                      className={`p-3.5 rounded-xl border space-y-3 ${
                        darkMode
                          ? 'bg-slate-950/90 border-teal-800/60'
                          : 'bg-teal-50/60 border-teal-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                          1. Komutu Kopyala → Ücretsiz AI&apos;ya Yapıştır
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowBridgePromptPreview((v) => !v)}
                          className="text-[11px] font-semibold underline opacity-80 hover:opacity-100"
                        >
                          {showBridgePromptPreview ? 'Komutu Gizle' : 'Önizle'}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyBridgePrompt}
                        className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        {bridgeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {bridgeCopied
                          ? 'Özel DUS Komutu Kopyalandı!'
                          : 'Özel DUS Komutunu Oluştur ve Kopyala'}
                      </button>

                      {/* Ücretsiz AI Sohbet Kısayolları */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <a
                          href="https://gemini.google.com/app"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                            darkMode
                              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-teal-500'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-teal-500'
                          }`}
                        >
                          <span>Gemini Aç</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                        <a
                          href="https://chatgpt.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                            darkMode
                              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-teal-500'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-teal-500'
                          }`}
                        >
                          <span>ChatGPT Aç</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                        <a
                          href="https://claude.ai/new"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                            darkMode
                              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-teal-500'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-teal-500'
                          }`}
                        >
                          <span>Claude Aç</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      </div>

                      {showBridgePromptPreview && (
                        <textarea
                          readOnly
                          value={currentBridgePrompt}
                          rows={5}
                          className={`w-full rounded-lg border p-2 text-[11px] font-mono ${
                            darkMode
                              ? 'bg-slate-900 border-slate-700 text-slate-300'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        />
                      )}

                      <div className="pt-2 border-t border-teal-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-teal-700 dark:text-teal-300">
                            2. AI&apos;dan Gelen JSON Yanıtını Yapıştır
                          </label>
                          <button
                            type="button"
                            onClick={handlePasteBridgeFromClipboard}
                            className="text-[11px] font-semibold flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline"
                          >
                            <ClipboardPaste className="w-3.5 h-3.5" />
                            Panodan Yapıştır
                          </button>
                        </div>

                        <textarea
                          value={bridgeJsonInput}
                          onChange={(e) => {
                            setBridgeJsonInput(e.target.value);
                            setBridgeError(null);
                          }}
                          rows={4}
                          placeholder='AI sohbetinden aldığınız { "questions": [ ... ] } JSON çıktısını buraya yapıştırın...'
                          className={`w-full rounded-xl border p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                            darkMode
                              ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-600'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                          }`}
                        />

                        {bridgeError && (
                          <p className="text-[11px] font-medium text-rose-500 leading-snug">{bridgeError}</p>
                        )}

                        <button
                          type="button"
                          disabled={!bridgeJsonInput.trim()}
                          onClick={handleImportBridgeQuestionsWithImage}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md disabled:opacity-45 flex items-center justify-center gap-2 transition-all"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Soruları Aktar ve Sınavı Başlat
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* MOD B: DOĞRUDAN GEMINI API İLE ÜRET */
                    <div className="space-y-3 pt-1">
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={handleGenerateExam}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 text-white font-bold text-sm shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Textbook&apos;lar Taranıyor...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Gemini API ile {questionCount} Soru Üret
                          </>
                        )}
                      </button>

                      {!apiKey && (
                        <button
                          type="button"
                          onClick={openApiSettings}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            darkMode
                              ? 'border-amber-700/70 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
                              : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Önce Google Gemini API Anahtarı Girin
                        </button>
                      )}
                    </div>
                  )}

                  {/* Hızlı Başlangıç: Örnek Kanonik Test & Manuel Görsel Soru Ekle */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsManualModalOpen(true)}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        darkMode
                          ? 'border-teal-800/70 bg-teal-950/30 hover:bg-teal-900/40 text-teal-300'
                          : 'border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-teal-800'
                      }`}
                    >
                      <ImagePlus className="w-3.5 h-3.5 text-teal-600" />
                      Manuel Görsel / Radyografi Sorusu Ekle
                    </button>

                    <button
                      type="button"
                      onClick={handleStartSampleExam}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        darkMode
                          ? 'border-slate-700 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                      Örnek Kanonik DUS Testi Çöz (4 Soru)
                    </button>
                  </div>
                </div>
              </aside>
            )}

            {/* SAĞ ANA SINAV / KARŞILAMA ALANI */}
            <section
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={focusMode || !session ? 'lg:col-span-8 lg:col-start-3' : 'lg:col-span-8'}
            >
              {/* YÜKLENİYOR DURUMU */}
              {isGenerating && (
                <div
                  className={`rounded-2xl border p-10 text-center space-y-4 shadow-sm ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-teal-600/15 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto animate-pulse">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-lg">
                    Textbook Referansları ve Çıkmış DUS Kalıpları Taranıyor...
                  </h3>
                  <p className="text-sm opacity-75 max-w-md mx-auto leading-relaxed">
                    Seçtiğiniz dersin uluslararası kanonik textbook&apos;ları ile geçmiş ÖSYM DUS soru konseptleri sentezlenerek 5 şıklı özgün sorular oluşturuluyor.
                  </p>
                </div>
              )}

              {/* HENÜZ AKTİF TEST YOKSA KARŞILAMA EKRANI */}
              {!isGenerating && !session && (
                <div
                  className={`rounded-2xl border p-6 sm:p-10 text-center shadow-sm ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-600/20">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h2 className="font-extrabold text-xl sm:text-2xl tracking-tight mb-2">
                    Textbook &amp; Çıkmış DUS Referanslı Soru Bankası
                  </h2>
                  <p className="text-sm opacity-75 max-w-xl mx-auto leading-relaxed mb-6">
                    Sol panelden ders ve alt konu seçerek hem <strong>kanonik textbook&apos;ları</strong> hem de <strong>geçmiş ÖSYM DUS soru konseptlerini</strong> referans alan özgün sorular üretebilir, ya da hemen örnek testi başlatabilirsiniz.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleStartSampleExam}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-teal-600/20"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Örnek Kanonik Testi Başlat (4 Soru)
                    </button>
                    {questionBank.length > SAMPLE_QUESTIONS.length && (
                      <button
                        type="button"
                        onClick={() => handleStartRemedialExam(questionBank)}
                        className={`px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${
                          darkMode
                            ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                            : 'border-slate-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <Layers className="w-4 h-4 text-teal-600" />
                        Kayıtlı Havuzdan Çöz ({questionBank.length} Soru)
                      </button>
                    )}
                  </div>

                  {/* Özellik Vurguları */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left">
                    <div
                      className={`p-4 rounded-xl border ${
                        darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5 text-teal-600 mb-2" />
                      <h4 className="font-bold text-sm mb-1">Denetçi (Akademik Doğrulama)</h4>
                      <p className="text-xs opacity-75 leading-relaxed">
                        Çözüm sonrası tek tıkla ikinci bir akademisyen denetimi başlatarak textbook uyumluluğunu ve baskı farklarını teyit edin.
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-xl border ${
                        darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <FileText className="w-5 h-5 text-cyan-600 mb-2" />
                      <h4 className="font-bold text-sm mb-1">Gerçek Kağıt Sınav Hissi</h4>
                      <p className="text-xs opacity-75 leading-relaxed">
                        Şıkların üzerini çizerek eleme yapın, canlı kronometre veya geri sayım sayacıyla sürenizi yönetin.
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-xl border ${
                        darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <RotateCcw className="w-5 h-5 text-amber-600 mb-2" />
                      <h4 className="font-bold text-sm mb-1">Otomatik Yanlış Defteri</h4>
                      <p className="text-xs opacity-75 leading-relaxed">
                        Yanlış yaptığınız sorular otomatik kaydedilir; istediğiniz an tek tıkla Telafi Testi başlatabilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AKTİF SINAV EKRANI */}
              {!isGenerating && session && currentQuestion && (
                <div className="space-y-4">
                  {/* Üst Sınav Navigasyon ve Sayaç Barı (Mobilde Yatay Kaydırılabilir Şerit) */}
                  <div
                    className={`rounded-2xl border p-3 sm:px-5 flex items-center justify-between gap-2.5 shadow-sm ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Soru Numarası Kutucukları */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar flex-1">
                      {syncedSessionQuestions.map((q, idx) => {
                        const ans = session.userAnswers[q.id];
                        const isCurrent = idx === currentIndex;
                        const reveal = session.isSubmitted || (session.mode === 'study' && Boolean(ans));

                        let btnClass = darkMode
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200';

                        if (reveal && ans) {
                          if (ans === q.correctAnswer) {
                            btnClass = 'bg-emerald-600 text-white border-emerald-600';
                          } else {
                            btnClass = 'bg-rose-600 text-white border-rose-600';
                          }
                        } else if (ans) {
                          btnClass = 'bg-teal-600 text-white border-teal-600';
                        }

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold border shrink-0 transition-all ${btnClass} ${
                              isCurrent ? 'ring-2 ring-teal-500 ring-offset-1 dark:ring-offset-slate-900 scale-105' : ''
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>

                    {/* Sağ Sayaç & Bitir / Ana Ekrana Dön Butonları */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                          darkMode
                            ? 'bg-slate-950 border-slate-800 text-teal-400'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          {session.timerMode === 'untimed'
                            ? 'Süresiz'
                            : session.timerMode === 'countdown'
                            ? formatTime(session.initialDurationSec - elapsedSeconds)
                            : formatTime(elapsedSeconds)}
                        </span>
                      </div>

                      {!session.isSubmitted ? (
                        <button
                          type="button"
                          onClick={() => handleSubmitExam(false)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors"
                        >
                          Testi Bitir
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCloseExamToHome}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition-colors"
                        >
                          Ana Ekrana Dön
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCloseExamToHome}
                        title="Testi Kapat ve Ana Ekrana Dön"
                        className={`p-1.5 rounded-lg border transition-colors ${
                          darkMode
                            ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobilde Kaydırma İpucu */}
                  <div className="sm:hidden flex items-center justify-between px-1 text-[11px] opacity-60">
                    <span>← Sorular arası geçiş için sağa/sola kaydırın →</span>
                    <span>
                      {currentIndex + 1} / {syncedSessionQuestions.length}
                    </span>
                  </div>

                  {/* Deneme Modu Sonuç Özeti (Test Bitirildiyse) */}
                  {session.isSubmitted && (() => {
                    const correctCnt = syncedSessionQuestions.filter(
                      (q) => session.userAnswers[q.id] === q.correctAnswer
                    ).length;
                    const wrongCnt = syncedSessionQuestions.filter(
                      (q) => session.userAnswers[q.id] && session.userAnswers[q.id] !== q.correctAnswer
                    ).length;
                    const emptyCnt = syncedSessionQuestions.filter((q) => !session.userAnswers[q.id]).length;
                    const netScore = (correctCnt - wrongCnt * 0.25).toFixed(2);

                    return (
                      <div
                        className={`rounded-2xl border p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 ${
                          darkMode
                            ? 'bg-gradient-to-r from-slate-900 to-teal-950/40 border-teal-800/60'
                            : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Award className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                          <div>
                            <h3 className="font-bold text-sm sm:text-base">Deneme Sınavı Tamamlandı</h3>
                            <p className="text-xs opacity-75">
                              {session.timerMode === 'untimed'
                                ? 'Süresiz Çalışma Modu'
                                : `Süre: ${formatTime(elapsedSeconds)}`}{' '}
                              • 4 yanlış 1 doğruyu götürür
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400">Doğru: {correctCnt}</span>
                          <span className="text-rose-600 dark:text-rose-400">Yanlış: {wrongCnt}</span>
                          <span className="opacity-70">Boş: {emptyCnt}</span>
                          <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs">
                            {netScore} Net
                          </span>
                          <button
                            type="button"
                            onClick={handleCloseExamToHome}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                          >
                            Ana Ekrana Dön / Yeni Test
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SORU KARTI */}
                  <div
                    className={`rounded-2xl border p-5 sm:p-7 shadow-sm ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Soru Üst Bilgi Etiketleri ve Favori Butonu */}
                    <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-teal-600 text-white">
                          Soru {currentIndex + 1} / {syncedSessionQuestions.length}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            darkMode ? 'bg-slate-800 text-teal-300' : 'bg-teal-50 text-teal-800'
                          }`}
                        >
                          {currentQuestion.subject}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                            darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {currentQuestion.questionType}
                        </span>
                        {currentQuestion.imageUrl && (
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            Görsel Vaka
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleFavorite(currentQuestion.id)}
                        title={currentQuestion.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          currentQuestion.isFavorite
                            ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                            : darkMode
                            ? 'border-slate-700 text-slate-400 hover:text-amber-400'
                            : 'border-slate-200 text-slate-600 hover:text-amber-600'
                        }`}
                      >
                        <Star
                          className={`w-4 h-4 ${currentQuestion.isFavorite ? 'fill-amber-500 text-amber-500' : ''}`}
                        />
                        <span className="hidden sm:inline">
                          {currentQuestion.isFavorite ? 'Favorilerde' : 'Favorilere Ekle'}
                        </span>
                      </button>
                    </div>

                    {/* GÖRSEL VAKA / RADYOGRAFİ ALANI (BÜYÜTME / LIGHTBOX DESTEKLİ) */}
                    {currentQuestion.imageUrl && (
                      <div
                        className={`mb-5 p-3 rounded-2xl border ${
                          darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div
                          onClick={() =>
                            setLightboxImage({
                              url: currentQuestion.imageUrl!,
                              caption: currentQuestion.imageCaption
                            })
                          }
                          className="relative group cursor-zoom-in rounded-xl overflow-hidden bg-black/90 flex items-center justify-center"
                        >
                          <img
                            src={currentQuestion.imageUrl}
                            alt={currentQuestion.imageCaption || 'DUS Vaka Görseli'}
                            className="max-h-72 sm:max-h-80 w-auto object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.02]"
                          />
                          <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-sm">
                            <ZoomIn className="w-3.5 h-3.5" />
                            Büyüt
                          </span>
                        </div>
                        {currentQuestion.imageCaption && (
                          <p className="text-xs text-center opacity-75 mt-2 font-medium">
                            {currentQuestion.imageCaption}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Öncüller (I, II, III) varsa üstte şık kutuda göster */}
                    {currentQuestion.premises && currentQuestion.premises.length > 0 && (
                      <div
                        className={`mb-4 p-4 rounded-xl border space-y-1.5 text-sm sm:text-[15px] font-medium ${
                          darkMode
                            ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        {currentQuestion.premises.map((premise, pIdx) => (
                          <p key={pIdx} className="leading-relaxed">
                            {premise}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Soru Kökü Metni */}
                    <div className="mb-6">
                      <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-line font-medium">
                        {currentQuestion.stem}
                      </p>
                    </div>

                    {/* A, B, C, D, E Şıkları */}
                    <div className="space-y-2.5">
                      {(['A', 'B', 'C', 'D', 'E'] as OptionKey[]).map((optKey) => {
                        const optionText = currentQuestion.options[optKey];
                        const userSelected = session.userAnswers[currentQuestion.id] === optKey;
                        const isCorrectOpt = currentQuestion.correctAnswer === optKey;
                        const isEliminated = (session.eliminatedOptions[currentQuestion.id] || []).includes(
                          optKey
                        );

                        let cardStyle = darkMode
                          ? 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                          : 'bg-white border-slate-200 hover:border-teal-400 hover:bg-slate-50/70';

                        let badgeStyle = darkMode
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-100 text-slate-700';

                        if (isCurrentSolutionVisible) {
                          if (isCorrectOpt) {
                            cardStyle = darkMode
                              ? 'bg-emerald-950/50 border-emerald-600 text-emerald-100'
                              : 'bg-emerald-50 border-emerald-500 text-emerald-950';
                            badgeStyle = 'bg-emerald-600 text-white';
                          } else if (userSelected && !isCorrectOpt) {
                            cardStyle = darkMode
                              ? 'bg-rose-950/50 border-rose-600 text-rose-100'
                              : 'bg-rose-50 border-rose-500 text-rose-950';
                            badgeStyle = 'bg-rose-600 text-white';
                          } else {
                            cardStyle = darkMode
                              ? 'bg-slate-950/30 border-slate-800/70 opacity-75'
                              : 'bg-slate-50/50 border-slate-200/70 opacity-80';
                          }
                        } else if (userSelected) {
                          cardStyle = darkMode
                            ? 'bg-teal-950/50 border-teal-500 text-teal-100'
                            : 'bg-teal-50 border-teal-600 text-teal-950';
                          badgeStyle = 'bg-teal-600 text-white';
                        }

                        return (
                          <div
                            key={optKey}
                            onClick={() => handleSelectOption(currentQuestion, optKey)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleSelectOption(currentQuestion, optKey);
                              }
                            }}
                            className={`group flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${cardStyle}`}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${badgeStyle}`}
                              >
                                {optKey}
                              </span>
                              <span
                                className={`text-sm sm:text-[15px] leading-snug pt-0.5 transition-all ${
                                  isEliminated && !isCurrentSolutionVisible
                                    ? 'line-through opacity-40 decoration-2'
                                    : ''
                                }`}
                              >
                                {optionText}
                              </span>
                            </div>

                            {/* Sağ İkonlar: Doğru/Yanlış Rozeti veya Şıkkı Ele İkonu */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isCurrentSolutionVisible && isCorrectOpt && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              )}
                              {isCurrentSolutionVisible && userSelected && !isCorrectOpt && (
                                <XCircle className="w-5 h-5 text-rose-500" />
                              )}

                              {!isCurrentSolutionVisible && (
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleEliminate(e, currentQuestion.id, optKey)}
                                  title={isEliminated ? 'Elemeyi Kaldır' : 'Şıkkı Ele (Üstünü Çiz)'}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isEliminated
                                      ? 'bg-rose-500/15 text-rose-500'
                                      : 'opacity-40 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <EyeOff className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Alt Önceki / Sonraki Soru Navigasyonu */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors disabled:opacity-40 ${
                          darkMode
                            ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                            : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Önceki Soru
                      </button>

                      {currentIndex < syncedSessionQuestions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentIndex((i) => Math.min(syncedSessionQuestions.length - 1, i + 1))
                          }
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                        >
                          Sonraki Soru
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : !session.isSubmitted ? (
                        <button
                          type="button"
                          onClick={() => handleSubmitExam(false)}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                          Testi Bitir ve Sonuçları Gör
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCloseExamToHome}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Ana Ekrana Dön / Yeni Test
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DETAYLI ÇÖZÜM KARTI VE DENETÇİ MODU */}
                  {isCurrentSolutionVisible && (
                    <div
                      className={`rounded-2xl border p-5 sm:p-7 shadow-sm space-y-5 animate-fade-in ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Doğru Cevap & Textbook Referans Başlığı */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-bold">
                            Doğru Cevap: {currentQuestion.correctAnswer}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400">
                            {currentQuestion.textbookReference}
                          </span>
                        </div>
                      </div>

                      {/* Klinik / Fizyolojik Mekanizma Özeti */}
                      <div
                        className={`p-4 rounded-xl border space-y-1.5 ${
                          darkMode
                            ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                            : 'bg-teal-50/50 border-teal-100 text-slate-800'
                        }`}
                      >
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                          Klinik & Akademik Mekanizma Özeti
                        </h4>
                        <p className="text-xs sm:text-sm leading-relaxed">
                          {currentQuestion.mechanismExplanation}
                        </p>
                      </div>

                      {/* Diğer Şıkların Madde Madde Analizi */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">
                          Seçenek ve Çeldirici Analizi
                        </h4>
                        <div className="space-y-2">
                          {(['A', 'B', 'C', 'D', 'E'] as OptionKey[]).map((optKey) => {
                            const isCorrect = optKey === currentQuestion.correctAnswer;
                            const explanation =
                              currentQuestion.distractorExplanations?.[optKey] ||
                              (isCorrect ? 'Doğru seçenektir.' : 'Bu seçenek klinik/bilimsel kriterleri karşılamamaktadır.');

                            return (
                              <div
                                key={optKey}
                                className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                                  isCorrect
                                    ? darkMode
                                      ? 'bg-emerald-950/35 border-emerald-700/70 text-emerald-100'
                                      : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                    : darkMode
                                    ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                                    : 'bg-slate-50 border-slate-200/80 text-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : darkMode
                                      ? 'bg-slate-800 text-slate-300'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {optKey}
                                </span>
                                <p className="leading-relaxed pt-0.5">{explanation}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* DENETÇİ MODU ("AKADEMİK DOĞRULAMA YAP" BUTONU - API VE API'SİZ KÖPRÜ DESTEKLİ) */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs opacity-75">
                            Soruyu kıdemli bir DUS akademisyeni gözüyle denetleyerek textbook baskı (edition) farkı olup olmadığını kontrol edin.
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {apiKey && (
                              <button
                                type="button"
                                disabled={auditingQuestionId === currentQuestion.id}
                                onClick={() => handleAuditQuestion(currentQuestion)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                  darkMode
                                    ? 'bg-indigo-950/60 border-indigo-700 text-indigo-300 hover:bg-indigo-900/60'
                                    : 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
                                } disabled:opacity-50`}
                              >
                                {auditingQuestionId === currentQuestion.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ShieldCheck className="w-4 h-4" />
                                )}
                                {auditingQuestionId === currentQuestion.id
                                  ? 'Akademisyen Denetliyor...'
                                  : 'Akademik Doğrulama Yap (API)'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCopyBridgeAuditPrompt(currentQuestion)}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                darkMode
                                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-teal-500'
                                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:border-teal-600'
                              }`}
                            >
                              <Copy className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              {bridgeAuditCopiedId === currentQuestion.id
                                ? 'Denetim Komutu Kopyalandı!'
                                : "Denetim Komutunu Kopyala (API'siz)"}
                            </button>
                          </div>
                        </div>

                        {/* API'siz Denetçi Yapıştırma Alanı */}
                        {bridgeAuditOpenId === currentQuestion.id && (
                          <div
                            className={`mt-3 p-3.5 rounded-xl border space-y-2.5 ${
                              darkMode
                                ? 'bg-slate-950 border-slate-800'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold">
                                Kopyalanan denetim komutunu Gemini / ChatGPT sohbetine yapıştırıp dönen JSON raporunu aşağıya aktarın:
                              </span>
                              <button
                                type="button"
                                onClick={() => setBridgeAuditOpenId(null)}
                                className="opacity-60 hover:opacity-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              value={bridgeAuditJsonInput}
                              onChange={(e) => setBridgeAuditJsonInput(e.target.value)}
                              rows={3}
                              placeholder='AI denetçisinden gelen { "isVerified": true, "verdictTitle": "...", ... } JSON çıktısını buraya yapıştırın...'
                              className={`w-full rounded-lg border p-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                darkMode
                                  ? 'bg-slate-900 border-slate-700 text-slate-100'
                                  : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                            <div className="flex justify-end">
                              <button
                                type="button"
                                disabled={!bridgeAuditJsonInput.trim()}
                                onClick={() => handleApplyBridgeAudit(currentQuestion)}
                                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold disabled:opacity-45"
                              >
                                Denetim Raporunu İşle
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Denetim Sonucu Kutusu */}
                        {currentQuestion.auditResult && (
                          <div
                            className={`mt-3 p-4 rounded-xl border flex items-start gap-3 ${
                              currentQuestion.auditResult.isVerified
                                ? darkMode
                                  ? 'bg-emerald-950/40 border-emerald-700 text-emerald-100'
                                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                : darkMode
                                ? 'bg-amber-950/40 border-amber-700 text-amber-100'
                                : 'bg-amber-50 border-amber-300 text-amber-950'
                            }`}
                          >
                            {currentQuestion.auditResult.isVerified ? (
                              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <div className="text-xs space-y-1.5 flex-1">
                              <div className="font-bold flex flex-wrap items-center justify-between gap-2">
                                <span>{currentQuestion.auditResult.verdictTitle}</span>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">
                                    Güven Skoru: %{currentQuestion.auditResult.confidenceScore}
                                  </span>
                                  <span className="opacity-60 font-normal">
                                    {currentQuestion.auditResult.checkedAt}
                                  </span>
                                </div>
                              </div>
                              <p className="leading-relaxed opacity-90">{currentQuestion.auditResult.detailedReview}</p>
                              <p className="font-semibold opacity-80">
                                Baskı (Edition) Notu: {currentQuestion.auditResult.editionNotes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ====================================================================
            SEKME 2: YANLIŞ DEFTERİ & KAYDEDİLENLER
        ==================================================================== */}
        {activeTab === 'notebook' && (
          <div className="space-y-6">
            {/* Üst Filtre ve Telafi Testi Kartı */}
            <div
              className={`rounded-2xl border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2 text-sm font-bold">
                  <Filter className="w-4 h-4 text-teal-600" />
                  <span>Filtre:</span>
                </div>

                <button
                  onClick={() => setNotebookFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    notebookFilterType === 'all'
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : darkMode
                      ? 'border-slate-700 text-slate-300'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Tümü ({analyticsData.wrongBookCount + analyticsData.favoriteCount})
                </button>

                <button
                  onClick={() => setNotebookFilterType('due')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    notebookFilterType === 'due'
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : darkMode
                      ? 'border-slate-700 text-slate-300'
                      : 'border-slate-200 text-slate-700'
                  }`}
                  title="Aralıklı tekrar: yanlış yapılan sorular 1, 3, 7 ve 21 gün sonra tekrar sorulur"
                >
                  Bugün Tekrar ({analyticsData.dueReviewCount})
                </button>

                <button
                  onClick={() => setNotebookFilterType('wrong')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    notebookFilterType === 'wrong'
                      ? 'bg-rose-600 border-rose-600 text-white'
                      : darkMode
                      ? 'border-slate-700 text-slate-300'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Sadece Yanlışlar ({analyticsData.wrongBookCount})
                </button>

                <button
                  onClick={() => setNotebookFilterType('favorites')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    notebookFilterType === 'favorites'
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : darkMode
                      ? 'border-slate-700 text-slate-300'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Favoriler ({analyticsData.favoriteCount})
                </button>

                <select
                  value={notebookSubjectFilter}
                  onChange={(e) => setNotebookSubjectFilter(e.target.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold focus:outline-none ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">Tüm Dersler</option>
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleStartRemedialExam(notebookQuestions)}
                disabled={notebookQuestions.length === 0}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Telafi Testi Başlat ({notebookQuestions.length} Soru)
              </button>
            </div>

            {/* Liste */}
            {notebookQuestions.length === 0 ? (
              <div
                className={`rounded-2xl border p-12 text-center ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <BookmarkCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <h3 className="font-bold text-base mb-1">Bu Filtrede Kayıtlı Soru Bulunamadı</h3>
                <p className="text-sm opacity-70 max-w-md mx-auto">
                  Çözdüğünüz testlerde yanlış yaptığınız sorular otomatik olarak buraya eklenir. Ayrıca herhangi bir soruyu yıldız ikonuna tıklayarak favorilerinize kaydedebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notebookQuestions.map((q) => {
                  const isExpanded = Boolean(expandedNotebookIds[q.id]);
                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl border p-5 shadow-sm transition-all ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                              darkMode ? 'bg-teal-950 text-teal-300' : 'bg-teal-50 text-teal-800'
                            }`}
                          >
                            {q.subject}
                          </span>
                          {q.isWrongPreviously && (
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                              Yanlış Defteri {q.lastUserAnswer ? `(Son İşaret: ${q.lastUserAnswer})` : ''}
                            </span>
                          )}
                          {q.isWrongPreviously && (
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                isReviewDue(q)
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                              }`}
                              title="Aralıklı tekrar: 1, 3, 7 ve 21 gün sonraki tekrarların hepsini doğru yapınca soru defterden çıkar"
                            >
                              {describeNextReview(q)} · {Math.min(q.reviewStage || 0, REVIEW_INTERVAL_DAYS.length)}/{REVIEW_INTERVAL_DAYS.length}
                            </span>
                          )}
                          {q.isFavorite && (
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              ★ Favori
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleFavorite(q.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:text-amber-500"
                            title="Favori Durumunu Değiştir"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                q.isFavorite ? 'fill-amber-500 text-amber-500' : 'opacity-60'
                              }`}
                            />
                          </button>

                          {q.isWrongPreviously && (
                            <button
                              onClick={() =>
                                setQuestionBank((prev) =>
                                  prev.map((item) =>
                                    item.id === q.id
                                      ? { ...item, isWrongPreviously: false, reviewStage: undefined, nextReviewAt: undefined }
                                      : item
                                  )
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-600"
                              title="Öğrenildi olarak işaretle ve yanlış listesinden çıkar"
                            >
                              Öğrenildi İşaretle
                            </button>
                          )}

                          <button
                            onClick={() =>
                              setExpandedNotebookIds((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {isExpanded ? 'Çözümü Gizle' : 'Şıkları ve Çözümü Gör'}
                          </button>
                        </div>
                      </div>

                      {q.premises && q.premises.length > 0 && (
                        <div className="mb-2 text-xs sm:text-sm opacity-85 space-y-1 pl-2 border-l-2 border-teal-500">
                          {q.premises.map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      )}

                      <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-line font-medium">
                        {q.stem}
                      </p>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                          {q.imageUrl && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/90 p-2 text-center">
                              <img
                                src={q.imageUrl}
                                alt={q.imageCaption || 'Soru Görseli'}
                                onClick={() =>
                                  setLightboxImage({ url: q.imageUrl!, caption: q.imageCaption })
                                }
                                className="max-h-56 w-auto object-contain mx-auto cursor-zoom-in rounded"
                              />
                              {q.imageCaption && (
                                <p className="text-[11px] text-slate-300 mt-1.5">{q.imageCaption}</p>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-2">
                            {(['A', 'B', 'C', 'D', 'E'] as OptionKey[]).map((k) => {
                              const isCorrect = k === q.correctAnswer;
                              return (
                                <div
                                  key={k}
                                  className={`p-2.5 rounded-lg border text-xs sm:text-sm flex items-center gap-2 ${
                                    isCorrect
                                      ? darkMode
                                        ? 'bg-emerald-950/50 border-emerald-600 text-emerald-100 font-semibold'
                                        : 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                                      : darkMode
                                      ? 'border-slate-800 opacity-75'
                                      : 'border-slate-200 opacity-80'
                                  }`}
                                >
                                  <span className="font-bold">{k})</span>
                                  <span>{q.options[k]}</span>
                                </div>
                              );
                            })}
                          </div>

                          <div
                            className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                              darkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-700'
                            }`}
                          >
                            <p className="font-bold text-teal-600 dark:text-teal-400 mb-1">
                              Referans: {q.textbookReference}
                            </p>
                            <p>{q.mechanismExplanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            SEKME 3: PERFORMANS ANALİZİ
        ==================================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Üst Özet Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div
                className={`rounded-2xl border p-5 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Toplam Çözülen
                  </span>
                  <Layers className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-2xl font-extrabold">{analyticsData.totalAttempts}</div>
                <p className="text-xs opacity-65 mt-1">Havuz: {analyticsData.totalGenerated} soru</p>
              </div>

              <div
                className={`rounded-2xl border p-5 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Toplam DUS Neti
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-teal-500" />
                </div>
                <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">
                  {analyticsData.totalNet}
                </div>
                <p className="text-xs opacity-65 mt-1">4 yanlış 1 doğruyu götürür</p>
              </div>

              <div
                className={`rounded-2xl border p-5 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Genel Başarı
                  </span>
                  <Award className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  %{analyticsData.overallAccuracy}
                </div>
                <p className="text-xs opacity-65 mt-1">
                  {analyticsData.totalCorrect}D • {analyticsData.totalWrong}Y
                </p>
              </div>

              <div
                className={`rounded-2xl border p-5 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Klinik Bilimler
                  </span>
                  <Stethoscope className="w-4 h-4 text-cyan-500" />
                </div>
                <div className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">
                  %{analyticsData.klinikAccuracy}
                </div>
                <p className="text-xs opacity-65 mt-1">
                  {analyticsData.klinikCorrect} / {analyticsData.klinikAttempts} soru
                </p>
              </div>

              <div
                className={`rounded-2xl border p-5 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Temel Bilimler
                  </span>
                  <Microscope className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  %{analyticsData.temelAccuracy}
                </div>
                <p className="text-xs opacity-65 mt-1">
                  {analyticsData.temelCorrect} / {analyticsData.temelAttempts} soru
                </p>
              </div>
            </div>

            {/* Güçlü / Zayıf Ders Özeti */}
            {analyticsData.strongestSubject && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`rounded-2xl border p-4 flex items-center justify-between ${
                    darkMode ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      En Yüksek Başarı Gösterilen Ders
                    </span>
                    <h4 className="font-bold text-base mt-0.5">{analyticsData.strongestSubject.name}</h4>
                  </div>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    %{analyticsData.strongestSubject.accuracy}
                  </span>
                </div>

                {analyticsData.weakestSubject && (
                  <div
                    className={`rounded-2xl border p-4 flex items-center justify-between ${
                      darkMode ? 'bg-amber-950/20 border-amber-800/50' : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Tekrar Önerilen (Gelişime Açık) Ders
                      </span>
                      <h4 className="font-bold text-base mt-0.5">{analyticsData.weakestSubject.name}</h4>
                    </div>
                    <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                      %{analyticsData.weakestSubject.accuracy}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Ders Bazlı Detaylı İlerleme Çubukları */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(['Klinik Bilimler', 'Temel Bilimler'] as CategoryType[]).map((cat) => {
                const catSubjects = analyticsData.perSubject.filter((s) => s.category === cat);
                return (
                  <div
                    key={cat}
                    className={`rounded-2xl border p-5 sm:p-6 ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                      {cat === 'Klinik Bilimler' ? (
                        <Stethoscope className="w-5 h-5 text-teal-600" />
                      ) : (
                        <Microscope className="w-5 h-5 text-indigo-600" />
                      )}
                      <h3 className="font-bold text-base">
                        {cat} ({catSubjects.length} Ders)
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {catSubjects.map((subj) => (
                        <div key={subj.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-semibold">{subj.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="opacity-70">
                                {subj.correct}D / {subj.wrong}Y ({subj.net} Net)
                              </span>
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-xs ${
                                  subj.attempts === 0
                                    ? 'opacity-50'
                                    : subj.accuracy >= 70
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : subj.accuracy >= 50
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                %{subj.accuracy}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-full h-2.5 rounded-full overflow-hidden ${
                              darkMode ? 'bg-slate-800' : 'bg-slate-100'
                            }`}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                subj.accuracy >= 70
                                  ? 'bg-emerald-500'
                                  : subj.accuracy >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-teal-600'
                              }`}
                              style={{ width: `${subj.attempts > 0 ? subj.accuracy : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Veri Yedekleme */}
            <div
              className={`rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <h4 className="font-bold text-sm">Veri Yönetimi ve Cihazlar Arası Taşıma</h4>
                <p className="text-xs opacity-75">
                  Tüm soru havuzunuz ve çözüm istatistikleriniz yalnızca tarayıcınızda saklanır. JSON formatında yedek alabilirsiniz.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportJson}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Tüm Verileri İndir (.json)
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                    darkMode
                      ? 'border-slate-700 hover:bg-slate-800'
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Yedekten Yükle (.json)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          MOBİL UYGULAMA ALT NAVİGASYON BARI (NATIVE BOTTOM TAB BAR)
      ==================================================================== */}
      {!focusMode && (
        <nav
          className={`lg:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-lg pb-[env(safe-area-inset-bottom)] ${
            darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
          }`}
        >
          <div className="grid grid-cols-4 h-16">
            <button
              type="button"
              onClick={() => {
                setActiveTab('exam');
                setMobileDrawerOpen(true);
              }}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                activeTab === 'exam'
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Soru Çöz</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notebook')}
              className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                activeTab === 'notebook'
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <div className="relative">
                <BookmarkCheck className="w-5 h-5" />
                {analyticsData.dueReviewCount > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {analyticsData.dueReviewCount}
                  </span>
                ) : analyticsData.wrongBookCount + analyticsData.favoriteCount > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {analyticsData.wrongBookCount + analyticsData.favoriteCount}
                  </span>
                ) : null}
              </div>
              <span>Defterim</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                activeTab === 'analytics'
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analiz</span>
            </button>

            <button
              type="button"
              onClick={handleInstallPwaClick}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-600"
            >
              <Smartphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Uygulama</span>
            </button>
          </div>
        </nav>
      )}

      {/* ====================================================================
          TELEFONA UYGULAMA OLARAK YÜKLEME REHBERİ MODALI (iOS & ANDROID)
      ==================================================================== */}
      {isPwaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-6 shadow-2xl space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Telefonunuza Uygulama Olarak Kurun</h3>
                  <p className="text-xs opacity-70">Tam ekran, tarayıcı çubuğu olmadan kullanın</p>
                </div>
              </div>
              <button
                onClick={() => setIsPwaModalOpen(false)}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div
                className={`p-3.5 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <p className="font-bold text-sm">
                  ⚠️ Chrome &quot;Bu uygulama yüklenemez&quot; Uyarısı Veriyorsa:
                </p>
                <p>
                  Uygulama şu an bir sohbet/önizleme çerçevesi (iframe) içinde açıldığı için Android Chrome güvenlik gereği doğrudan APK paketlemesine izin vermez.
                </p>
                <p className="font-semibold pt-1">
                  ✅ Kesin Çözüm (2 Adım):
                </p>
                <p>
                  1. Önizleme penceresinin sağ üst köşesindeki <strong>Paylaş / Yeni Sekmede Aç</strong> butonuna basıp sayfayı doğrudan Chrome sekmesinde açın ve <strong>Ana Ekrana Ekle &gt; Kısayol Oluştur</strong> deyin.
                </p>
                <p>
                  2. Ana ekrana eklenen ikona dokunduğunuzda uygulama tarayıcı çubuğu olmadan tam ekran mobil uygulama gibi açılır.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <p className="font-bold text-sm text-teal-600 dark:text-teal-400">
                  📱 iPhone / iPad (Safari)
                </p>
                <p className="flex items-center gap-1.5">
                  1. Alt bardaki <Share className="w-4 h-4 inline text-sky-500" /> <strong>Paylaş</strong> simgesine dokunun.
                </p>
                <p className="flex items-center gap-1.5">
                  2. Aşağı kaydırıp <PlusSquare className="w-4 h-4 inline text-teal-500" /> <strong>Ana Ekrana Ekle</strong> seçeneğine dokunun.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleExportJson}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                  darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Yedek Al (.json)
              </button>
              <button
                type="button"
                onClick={() => setIsPwaModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          GOOGLE GEMINI API AYARLARI MODALI (BAĞLANTI TESTİ DESTEKLİ)
      ==================================================================== */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-lg">Google Gemini API Ayarları</h3>
              </div>
              <button
                onClick={() => setIsApiModalOpen(false)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveApiSettings} className="space-y-4">
              {/* Bilgilendirme Kutusu */}
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  darkMode
                    ? 'bg-teal-950/30 border-teal-800/60 text-teal-200'
                    : 'bg-teal-50 border-teal-200 text-teal-900'
                }`}
              >
                <p className="font-semibold mb-1">API Anahtarınızı Nasıl Alırsınız?</p>
                <p className="opacity-90">
                  Google AI Studio üzerinden ücretsiz veya ücretli bir Gemini API anahtarı oluşturup aşağıdaki kutuya yapıştırabilirsiniz. Anahtarınız yalnızca tarayıcınızda saklanır.
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 font-bold underline hover:opacity-80"
                >
                  Google AI Studio API Anahtarı Sayfasını Aç
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
                  Google Gemini API Anahtarı
                </label>
                <div className="relative">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    value={tempApiKey}
                    onChange={(e) => {
                      setTempApiKey(e.target.value);
                      setConnectionTestResult(null);
                    }}
                    placeholder="AIzaSy... şeklindeki anahtarınızı buraya yapıştırın"
                    className={`w-full rounded-xl border pr-10 pl-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      darkMode
                        ? 'bg-slate-950 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
                  Yapay Zeka Modeli Seçimi
                </label>
                <select
                  value={tempModel}
                  onChange={(e) => {
                    setTempModel(e.target.value);
                    setConnectionTestResult(null);
                  }}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    darkMode
                      ? 'bg-slate-950 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Varsayılan • Çok Hızlı & Yüksek Verim)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (Derin Klinik Akıl Yürütme & Zor Vaka)</option>
                </select>
              </div>

              {/* Bağlantıyı Test Et Butonu ve Sonuç Kutusu */}
              <div>
                <button
                  type="button"
                  disabled={isTestingConnection || !tempApiKey.trim()}
                  onClick={handleTestConnection}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                    darkMode
                      ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {isTestingConnection ? (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  ) : (
                    <Wifi className="w-4 h-4 text-teal-600" />
                  )}
                  {isTestingConnection ? 'Gemini API Bağlantısı Test Ediliyor...' : 'Bağlantıyı Test Et'}
                </button>

                {connectionTestResult && (
                  <div
                    className={`mt-2.5 p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                      connectionTestResult.ok
                        ? darkMode
                          ? 'bg-emerald-950/50 border-emerald-700 text-emerald-200'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : darkMode
                        ? 'bg-rose-950/50 border-rose-700 text-rose-200'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    {connectionTestResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <span>{connectionTestResult.message}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempApiKey('');
                      setApiKey('');
                      setConnectionTestResult(null);
                      localStorage.removeItem(STORAGE_KEYS.API_KEY);
                      showToast('info', 'API anahtarı tarayıcıdan temizlendi.');
                    }}
                    className="mr-auto text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Anahtarı Sil
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsApiModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MANUEL GÖRSEL / RADYOGRAFİ SORUSU EKLEME MODALI
      ==================================================================== */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-5 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base sm:text-lg">Manuel Görsel / Radyografi DUS Sorusu Ekle</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                    Ders Seçimi
                  </label>
                  <select
                    value={manualSubjectId}
                    onChange={(e) => setManualSubjectId(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium ${
                      darkMode ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                    Alt Konu (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={manualSubtopic}
                    onChange={(e) => setManualSubtopic(e.target.value)}
                    placeholder="Örn: Odontojenik Keratokist, CBCT Anatomi..."
                    className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm ${
                      darkMode ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
              </div>

              {/* Görsel Yükleme Alanı */}
              <div
                className={`p-3.5 rounded-xl border space-y-2.5 ${
                  darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Soru Görseli (Radyografi / Klinik Fotoğraf / Şema)</span>
                  <label className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{manualImageUrl ? 'Görseli Değiştir' : 'Cihazdan Görsel Yükle'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSelectReferenceImage(e, 'manual')}
                      className="hidden"
                    />
                  </label>
                </div>

                {manualImageUrl && (
                  <div className="relative rounded-xl overflow-hidden bg-black/90 p-2">
                    <img
                      src={manualImageUrl}
                      alt="Önizleme"
                      className="max-h-48 w-auto object-contain mx-auto rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setManualImageUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-rose-600 text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  value={manualImageCaption}
                  onChange={(e) => setManualImageCaption(e.target.value)}
                  placeholder="Görsel altı açıklaması (Örn: 34 yaşındaki hastanın panoramik radyografisi)"
                  className={`w-full rounded-lg border px-3 py-1.5 text-xs ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                  Soru Kökü *
                </label>
                <textarea
                  required
                  rows={3}
                  value={manualStem}
                  onChange={(e) => setManualStem(e.target.value)}
                  placeholder="Yukarıdaki radyografide / klinik görünümde izlenen lezyon için en olası tanı aşağıdakilerden hangisidir?"
                  className={`w-full rounded-xl border p-3 text-xs sm:text-sm ${
                    darkMode ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              {/* 5 Şık ve Doğru Cevap Seçimi */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-80">
                  Seçenekler ve Doğru Cevap İşaretlemesi *
                </label>
                {(['A', 'B', 'C', 'D', 'E'] as OptionKey[]).map((optKey) => (
                  <div key={optKey} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setManualCorrect(optKey)}
                      title="Doğru cevap olarak işaretle"
                      className={`w-8 h-8 rounded-lg text-xs font-bold shrink-0 border transition-colors ${
                        manualCorrect === optKey
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : darkMode
                          ? 'bg-slate-950 border-slate-700 text-slate-400'
                          : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                    >
                      {optKey}
                    </button>
                    <input
                      type="text"
                      required
                      value={manualOptions[optKey]}
                      onChange={(e) =>
                        setManualOptions((prev) => ({ ...prev, [optKey]: e.target.value }))
                      }
                      placeholder={`${optKey} şıkkı metni...`}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs sm:text-sm ${
                        darkMode ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                    Textbook Referansı
                  </label>
                  <input
                    type="text"
                    value={manualReference}
                    onChange={(e) => setManualReference(e.target.value)}
                    placeholder="Örn: White & Pharoah Oral Radiology"
                    className={`w-full rounded-xl border px-3 py-2 text-xs ${
                      darkMode ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                    Çözüm Açıklaması
                  </label>
                  <input
                    type="text"
                    value={manualExplanation}
                    onChange={(e) => setManualExplanation(e.target.value)}
                    placeholder="Kısa klinik/radyografik açıklama..."
                    className={`w-full rounded-xl border px-3 py-2 text-xs ${
                      darkMode ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm"
                >
                  Soruyu Kaydet ve Aç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAM EKRAN GÖRSEL YAKINLAŞTIRMA (LIGHTBOX) PENCERESİ
      ==================================================================== */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage.url}
            alt={lightboxImage.caption || 'Büyütülmüş Vaka Görseli'}
            className="max-h-[82vh] max-w-[95vw] object-contain rounded-xl shadow-2xl"
          />
          {lightboxImage.caption && (
            <p className="mt-3 text-xs sm:text-sm text-white/90 text-center max-w-xl font-medium">
              {lightboxImage.caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}