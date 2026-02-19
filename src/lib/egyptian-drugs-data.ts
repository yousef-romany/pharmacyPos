// ====================================================================
// قاعدة بيانات الأدوية المصرية الشاملة
// Egyptian Comprehensive Drugs Database
// ====================================================================

export interface DrugCategoryData {
  id: string;
  categoryAR: string;
  categoryEN: string;
  description: string;
}

export interface EgyptianDrugData {
  id: string;
  nameAR: string;
  nameEN: string;
  activeIngredient: string;
  manufacturer: string;
  egyptianBarcode: string;
  categoryID: string;
  type: string;
  dosage: string;
  packaging: string;
  price?: number;
}

export const drugCategories: DrugCategoryData[] = [
  {
    id: 'cat-001',
    categoryAR: 'مسكنات الألم والحمى',
    categoryEN: 'Pain Relievers & Fever Reducers',
    description: 'أدوية لتسكين الآلام وخفض الحمى'
  },
  {
    id: 'cat-002',
    categoryAR: 'مضادات الالتهاب غير الستيروئيدية',
    categoryEN: 'Non-Steroidal Anti-Inflammatory Drugs (NSAIDs)',
    description: 'مضادات التهاب بدون ستيروئيدات'
  },
  {
    id: 'cat-003',
    categoryAR: 'المضادات الحيوية - البنسلين',
    categoryEN: 'Antibiotics - Penicillins',
    description: 'مضادات حيوية من فئة البنسلين'
  },
  {
    id: 'cat-004',
    categoryAR: 'المضادات الحيوية - السيفالوسبورين',
    categoryEN: 'Antibiotics - Cephalosporins',
    description: 'مضادات حيوية من فئة السيفالوسبورين'
  },
  {
    id: 'cat-005',
    categoryAR: 'المضادات الحيوية - الماكروليدات',
    categoryEN: 'Antibiotics - Macrolides',
    description: 'مضادات حيوية من فئة الماكروليدات'
  },
  {
    id: 'cat-006',
    categoryAR: 'المضادات الحيوية - الفلوروكينولونات',
    categoryEN: 'Antibiotics - Fluoroquinolones',
    description: 'مضادات حيوية من فئة الفلوروكينولونات'
  },
  {
    id: 'cat-007',
    categoryAR: 'مضادات الميكروبات',
    categoryEN: 'Antimicrobials',
    description: 'أدوية لمكافحة الميكروبات والطفيليات'
  },
  {
    id: 'cat-008',
    categoryAR: 'أدوية الجهاز التنفسي',
    categoryEN: 'Respiratory System Drugs',
    description: 'أدوية للربو والسعال وأمراض الجهاز التنفسي'
  },
  {
    id: 'cat-009',
    categoryAR: 'مضادات الحساسية',
    categoryEN: 'Antihistamines',
    description: 'أدوية لعلاج الحساسية والحكة'
  },
  {
    id: 'cat-010',
    categoryAR: 'أدوية الجهاز الهضمي',
    categoryEN: 'Gastrointestinal Drugs',
    description: 'أدوية لاضطرابات الجهاز الهضمي'
  },
  {
    id: 'cat-011',
    categoryAR: 'أدوية السكري',
    categoryEN: 'Diabetes Medications',
    description: 'أدوية لعلاج السكري وتنظيم السكر'
  },
  {
    id: 'cat-012',
    categoryAR: 'أدوية القلب والأوعية الدموية',
    categoryEN: 'Cardiovascular Drugs',
    description: 'أدوية لأمراض القلب وارتفاع ضغط الدم'
  },
  {
    id: 'cat-013',
    categoryAR: 'خافضات الكوليسترول والدهون',
    categoryEN: 'Lipid-Lowering Drugs',
    description: 'أدوية لخفض الكوليسترول والدهون'
  },
  {
    id: 'cat-014',
    categoryAR: 'أدوية الجهاز العصبي والنفسي',
    categoryEN: 'Central Nervous System Medications',
    description: 'أدوية للاكتئاب والقلق والنوم'
  },
  {
    id: 'cat-015',
    categoryAR: 'أدوية الغدد الصماء',
    categoryEN: 'Endocrine System Drugs',
    description: 'أدوية تنظيم الهرمونات والغدد'
  },
  {
    id: 'cat-016',
    categoryAR: 'الفيتامينات والمكملات',
    categoryEN: 'Vitamins & Supplements',
    description: 'مكملات غذائية وفيتامينات'
  }
];

export const egyptianDrugs: EgyptianDrugData[] = [
  // مسكنات الألم والحمى
  {
    id: 'drug-001',
    nameAR: 'باناسول',
    nameEN: 'Panadol',
    activeIngredient: 'Paracetamol 500mg',
    manufacturer: 'GlaxoSmithKline Egypt',
    egyptianBarcode: '6221100001001',
    categoryID: 'cat-001',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-002',
    nameAR: 'باناسول إكسترا',
    nameEN: 'Panadol Extra',
    activeIngredient: 'Paracetamol 500mg + Caffeine 65mg',
    manufacturer: 'GlaxoSmithKline Egypt',
    egyptianBarcode: '6221100001002',
    categoryID: 'cat-001',
    type: 'Tablet',
    dosage: '500mg+65mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-003',
    nameAR: 'سيتال',
    nameEN: 'Cetal',
    activeIngredient: 'Paracetamol 500mg',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100002001',
    categoryID: 'cat-001',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-004',
    nameAR: 'سيتال شراب',
    nameEN: 'Cetal Syrup',
    activeIngredient: 'Paracetamol 120mg/5ml',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100002002',
    categoryID: 'cat-001',
    type: 'Syrup',
    dosage: '120mg/5ml',
    packaging: '120ml bottle'
  },
  {
    id: 'drug-005',
    nameAR: 'أدول',
    nameEN: 'Adol',
    activeIngredient: 'Paracetamol 500mg',
    manufacturer: 'Pharmaswiss',
    egyptianBarcode: '6221100003001',
    categoryID: 'cat-001',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-006',
    nameAR: 'أدول إكسترا',
    nameEN: 'Adol Extra',
    activeIngredient: 'Paracetamol 500mg + Caffeine 65mg',
    manufacturer: 'Pharmaswiss',
    egyptianBarcode: '6221100003002',
    categoryID: 'cat-001',
    type: 'Tablet',
    dosage: '500mg+65mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-007',
    nameAR: 'فيفادول',
    nameEN: 'Fevadol',
    activeIngredient: 'Paracetamol 500mg',
    manufacturer: 'Pharco',
    egyptianBarcode: '6221100004001',
    categoryID: 'cat-001',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-008',
    nameAR: 'تيمبرا شراب',
    nameEN: 'Tempra Syrup',
    activeIngredient: 'Paracetamol 120mg/5ml',
    manufacturer: 'Bristol Myers Squibb',
    egyptianBarcode: '6221100005001',
    categoryID: 'cat-001',
    type: 'Syrup',
    dosage: '120mg/5ml',
    packaging: '100ml bottle'
  },
  // مضادات الالتهاب غير الستيروئيدية
  {
    id: 'drug-009',
    nameAR: 'برفين',
    nameEN: 'Brufen',
    activeIngredient: 'Ibuprofen 200mg',
    manufacturer: 'Abbott',
    egyptianBarcode: '6221100006001',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '200mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-010',
    nameAR: 'برفين 400',
    nameEN: 'Brufen 400',
    activeIngredient: 'Ibuprofen 400mg',
    manufacturer: 'Abbott',
    egyptianBarcode: '6221100006002',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '400mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-011',
    nameAR: 'برفين كولد',
    nameEN: 'Brufen Cold',
    activeIngredient: 'Ibuprofen 200mg + Pseudoephedrine 30mg',
    manufacturer: 'Abbott',
    egyptianBarcode: '6221100006003',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '200mg+30mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-012',
    nameAR: 'نيوروفن',
    nameEN: 'Nurofen',
    activeIngredient: 'Ibuprofen 200mg',
    manufacturer: 'RB',
    egyptianBarcode: '6221100007001',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '200mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-013',
    nameAR: 'فولتارين',
    nameEN: 'Voltaren',
    activeIngredient: 'Diclofenac 25mg',
    manufacturer: 'Novartis',
    egyptianBarcode: '6221100008001',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '25mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-014',
    nameAR: 'فولتارين 50',
    nameEN: 'Voltaren 50',
    activeIngredient: 'Diclofenac 50mg',
    manufacturer: 'Novartis',
    egyptianBarcode: '6221100008002',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '50mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-015',
    nameAR: 'فولتارين رابيد',
    nameEN: 'Voltaren Rapid',
    activeIngredient: 'Diclofenac 50mg',
    manufacturer: 'Novartis',
    egyptianBarcode: '6221100008003',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '50mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-016',
    nameAR: 'كاتافلام',
    nameEN: 'Cataflam',
    activeIngredient: 'Diclofenac 50mg',
    manufacturer: 'Novartis',
    egyptianBarcode: '6221100009001',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '50mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-017',
    nameAR: 'ديكلاك',
    nameEN: 'Diclac',
    activeIngredient: 'Diclofenac 25mg',
    manufacturer: 'Global Napi',
    egyptianBarcode: '6221100010001',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '25mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-018',
    nameAR: 'ديكلاك 75',
    nameEN: 'Diclac 75',
    activeIngredient: 'Diclofenac 75mg',
    manufacturer: 'Global Napi',
    egyptianBarcode: '6221100010002',
    categoryID: 'cat-002',
    type: 'Injection',
    dosage: '75mg/3ml',
    packaging: '3ml ampoule'
  },
  {
    id: 'drug-019',
    nameAR: 'ديكلاك جل',
    nameEN: 'Diclac Gel',
    activeIngredient: 'Diclofenac 1% w/w',
    manufacturer: 'Global Napi',
    egyptianBarcode: '6221100010003',
    categoryID: 'cat-002',
    type: 'Topical Gel',
    dosage: '1%',
    packaging: '30g tube'
  },
  {
    id: 'drug-020',
    nameAR: 'كيتوفان',
    nameEN: 'Ketofan',
    activeIngredient: 'Ketoprofen 50mg',
    manufacturer: 'Amriya',
    egyptianBarcode: '6221100011001',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '50mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-021',
    nameAR: 'كيتوفان جل',
    nameEN: 'Ketofan Gel',
    activeIngredient: 'Ketoprofen 2.5%',
    manufacturer: 'Amriya',
    egyptianBarcode: '6221100011002',
    categoryID: 'cat-002',
    type: 'Topical Gel',
    dosage: '2.5%',
    packaging: '30g tube'
  },
  {
    id: 'drug-022',
    nameAR: 'بروفينيد',
    nameEN: 'Profenid',
    activeIngredient: 'Ketoprofen 100mg',
    manufacturer: 'Pharmaswiss',
    egyptianBarcode: '6221100012001',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '100mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-023',
    nameAR: 'رابيديوس',
    nameEN: 'Rapidus',
    activeIngredient: 'Ketoprofen 25mg',
    manufacturer: 'Pharmaswiss',
    egyptianBarcode: '6221100012500',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '25mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-024',
    nameAR: 'سيليبريكس',
    nameEN: 'Celebrex',
    activeIngredient: 'Celecoxib 200mg',
    manufacturer: 'Pfizer',
    egyptianBarcode: '6221100013001',
    categoryID: 'cat-002',
    type: 'Capsule',
    dosage: '200mg',
    packaging: '10 capsules'
  },
  {
    id: 'drug-025',
    nameAR: 'أركوكسيا 60',
    nameEN: 'Arcoxia 60',
    activeIngredient: 'Etoricoxib 60mg',
    manufacturer: 'MSD',
    egyptianBarcode: '6221100013500',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '60mg',
    packaging: '14 tablets'
  },
  {
    id: 'drug-026',
    nameAR: 'موبيتيل',
    nameEN: 'Mobitil',
    activeIngredient: 'Meloxicam 15mg',
    manufacturer: 'Boehringer Ingelheim',
    egyptianBarcode: '6221100014001',
    categoryID: 'cat-002',
    type: 'Tablet',
    dosage: '15mg',
    packaging: '20 tablets'
  },
  // المضادات الحيوية - البنسلين
  {
    id: 'drug-027',
    nameAR: 'أوجمنتين',
    nameEN: 'Augmentin',
    activeIngredient: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    manufacturer: 'GlaxoSmithKline',
    egyptianBarcode: '6221100015001',
    categoryID: 'cat-003',
    type: 'Tablet',
    dosage: '500mg+125mg',
    packaging: '15 tablets'
  },
  {
    id: 'drug-028',
    nameAR: 'أوجمنتين إي إس',
    nameEN: 'Augmentin ES',
    activeIngredient: 'Amoxicillin 875mg + Clavulanic Acid 125mg',
    manufacturer: 'GlaxoSmithKline',
    egyptianBarcode: '6221100015002',
    categoryID: 'cat-003',
    type: 'Tablet',
    dosage: '875mg+125mg',
    packaging: '14 tablets'
  },
  {
    id: 'drug-029',
    nameAR: 'أوجمنتين شراب',
    nameEN: 'Augmentin Syrup',
    activeIngredient: 'Amoxicillin 250mg/5ml + Clavulanic Acid 62.5mg/5ml',
    manufacturer: 'GlaxoSmithKline',
    egyptianBarcode: '6221100015003',
    categoryID: 'cat-003',
    type: 'Syrup',
    dosage: '250mg/5ml',
    packaging: '100ml bottle'
  },
  {
    id: 'drug-030',
    nameAR: 'أموكسيل',
    nameEN: 'Amoxil',
    activeIngredient: 'Amoxicillin 500mg',
    manufacturer: 'GlaxoSmithKline',
    egyptianBarcode: '6221100016001',
    categoryID: 'cat-003',
    type: 'Capsule',
    dosage: '500mg',
    packaging: '15 capsules'
  },
  {
    id: 'drug-031',
    nameAR: 'أموكسيسيد',
    nameEN: 'Amoxicid',
    activeIngredient: 'Amoxicillin 500mg',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100017001',
    categoryID: 'cat-003',
    type: 'Capsule',
    dosage: '500mg',
    packaging: '15 capsules'
  },
  {
    id: 'drug-032',
    nameAR: 'هيبيوتيك',
    nameEN: 'Hibiotic',
    activeIngredient: 'Amoxicillin 500mg',
    manufacturer: 'Pharco',
    egyptianBarcode: '6221100018001',
    categoryID: 'cat-003',
    type: 'Capsule',
    dosage: '500mg',
    packaging: '15 capsules'
  },
  {
    id: 'drug-033',
    nameAR: 'ميجاموكس',
    nameEN: 'Megamox',
    activeIngredient: 'Amoxicillin 500mg',
    manufacturer: 'Pharmaswiss',
    egyptianBarcode: '6221100019001',
    categoryID: 'cat-003',
    type: 'Capsule',
    dosage: '500mg',
    packaging: '20 capsules'
  },
  {
    id: 'drug-034',
    nameAR: 'إي موكس كلاف',
    nameEN: 'E-moxclav',
    activeIngredient: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    manufacturer: 'Amriya',
    egyptianBarcode: '6221100020001',
    categoryID: 'cat-003',
    type: 'Tablet',
    dosage: '500mg+125mg',
    packaging: '15 tablets'
  },
  {
    id: 'drug-035',
    nameAR: 'كيورام',
    nameEN: 'Curam',
    activeIngredient: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    manufacturer: 'Glaxo',
    egyptianBarcode: '6221100021001',
    categoryID: 'cat-003',
    type: 'Tablet',
    dosage: '500mg+125mg',
    packaging: '15 tablets'
  },
  {
    id: 'drug-036',
    nameAR: 'فليموكسين',
    nameEN: 'Flemoxin',
    activeIngredient: 'Amoxicillin Trihydrate 500mg',
    manufacturer: 'Astellas',
    egyptianBarcode: '6221100022001',
    categoryID: 'cat-003',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '15 tablets'
  },
  // المضادات الحيوية - السيفالوسبورين
  {
    id: 'drug-037',
    nameAR: 'سوبراكس',
    nameEN: 'Suprax',
    activeIngredient: 'Cefixime 400mg',
    manufacturer: 'Sanofi',
    egyptianBarcode: '6221100023001',
    categoryID: 'cat-004',
    type: 'Tablet',
    dosage: '400mg',
    packaging: '10 tablets'
  },
  {
    id: 'drug-038',
    nameAR: 'سوبراكس شراب',
    nameEN: 'Suprax Syrup',
    activeIngredient: 'Cefixime 100mg/5ml',
    manufacturer: 'Sanofi',
    egyptianBarcode: '6221100023002',
    categoryID: 'cat-004',
    type: 'Syrup',
    dosage: '100mg/5ml',
    packaging: '75ml bottle'
  },
  {
    id: 'drug-039',
    nameAR: 'سيفوتاكس',
    nameEN: 'Cefotax',
    activeIngredient: 'Cefotaxime 500mg',
    manufacturer: 'AMRCO',
    egyptianBarcode: '6221100024001',
    categoryID: 'cat-004',
    type: 'Injection',
    dosage: '500mg/vial',
    packaging: 'Vial'
  },
  {
    id: 'drug-040',
    nameAR: 'سيفوتاكس 1 جرام',
    nameEN: 'Cefotax 1g',
    activeIngredient: 'Cefotaxime 1g',
    manufacturer: 'AMRCO',
    egyptianBarcode: '6221100024002',
    categoryID: 'cat-004',
    type: 'Injection',
    dosage: '1g/vial',
    packaging: 'Vial'
  },
  {
    id: 'drug-041',
    nameAR: 'سيفترياكسون',
    nameEN: 'Ceftriaxone',
    activeIngredient: 'Ceftriaxone 500mg',
    manufacturer: 'Various',
    egyptianBarcode: '6221100025001',
    categoryID: 'cat-004',
    type: 'Injection',
    dosage: '500mg/vial',
    packaging: 'Vial'
  },
  {
    id: 'drug-042',
    nameAR: 'سيفترياكسون 1 جرام',
    nameEN: 'Ceftriaxone 1g',
    activeIngredient: 'Ceftriaxone 1g',
    manufacturer: 'Various',
    egyptianBarcode: '6221100025002',
    categoryID: 'cat-004',
    type: 'Injection',
    dosage: '1g/vial',
    packaging: 'Vial'
  },
  {
    id: 'drug-043',
    nameAR: 'روسيفين',
    nameEN: 'Rocephin',
    activeIngredient: 'Ceftriaxone 250mg',
    manufacturer: 'Roche',
    egyptianBarcode: '6221100026001',
    categoryID: 'cat-004',
    type: 'Injection',
    dosage: '250mg/vial',
    packaging: 'Vial'
  },
  {
    id: 'drug-044',
    nameAR: 'روسيفين 1 جرام',
    nameEN: 'Rocephin 1g',
    activeIngredient: 'Ceftriaxone 1g',
    manufacturer: 'Roche',
    egyptianBarcode: '6221100026002',
    categoryID: 'cat-004',
    type: 'Injection',
    dosage: '1g/vial',
    packaging: 'Vial'
  },
  // المضادات الحيوية - الماكروليدات
  {
    id: 'drug-045',
    nameAR: 'زيثروماكس',
    nameEN: 'Zithromax',
    activeIngredient: 'Azithromycin 500mg',
    manufacturer: 'Pfizer',
    egyptianBarcode: '6221100027001',
    categoryID: 'cat-005',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '3 tablets'
  },
  {
    id: 'drug-046',
    nameAR: 'زيثروماكس شراب',
    nameEN: 'Zithromax Syrup',
    activeIngredient: 'Azithromycin 200mg/5ml',
    manufacturer: 'Pfizer',
    egyptianBarcode: '6221100027002',
    categoryID: 'cat-005',
    type: 'Syrup',
    dosage: '200mg/5ml',
    packaging: '15ml bottle'
  },
  {
    id: 'drug-047',
    nameAR: 'أزروليد',
    nameEN: 'Azrolid',
    activeIngredient: 'Azithromycin 500mg',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100028001',
    categoryID: 'cat-005',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '6 tablets'
  },
  {
    id: 'drug-048',
    nameAR: 'أزوميسين',
    nameEN: 'Azomycin',
    activeIngredient: 'Azithromycin 500mg',
    manufacturer: 'Pharco',
    egyptianBarcode: '6221100028500',
    categoryID: 'cat-005',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '6 tablets'
  },
  {
    id: 'drug-049',
    nameAR: 'كلاسيد',
    nameEN: 'Klacid',
    activeIngredient: 'Clarithromycin 500mg',
    manufacturer: 'Abbott',
    egyptianBarcode: '6221100029001',
    categoryID: 'cat-005',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '14 tablets'
  },
  {
    id: 'drug-050',
    nameAR: 'فروميليد',
    nameEN: 'Fromilid',
    activeIngredient: 'Clarithromycin 500mg',
    manufacturer: 'Pharmaswiss',
    egyptianBarcode: '6221100030001',
    categoryID: 'cat-005',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '14 tablets'
  },
  {
    id: 'drug-051',
    nameAR: 'إريثروسين',
    nameEN: 'Erythrocin',
    activeIngredient: 'Erythromycin 500mg',
    manufacturer: 'Abbott',
    egyptianBarcode: '6221100031001',
    categoryID: 'cat-005',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '20 tablets'
  },
  // المضادات الحيوية - الفلوروكينولونات
  {
    id: 'drug-052',
    nameAR: 'تافانيك',
    nameEN: 'Tavanic',
    activeIngredient: 'Levofloxacin 500mg',
    manufacturer: 'Sanofi',
    egyptianBarcode: '6221100032001',
    categoryID: 'cat-006',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '5 tablets'
  },
  {
    id: 'drug-053',
    nameAR: 'لفوكسين',
    nameEN: 'Levoxin',
    activeIngredient: 'Levofloxacin 500mg',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100033001',
    categoryID: 'cat-006',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '10 tablets'
  },
  {
    id: 'drug-054',
    nameAR: 'سيبروسين',
    nameEN: 'Ciprocin',
    activeIngredient: 'Ciprofloxacin 500mg',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100034001',
    categoryID: 'cat-006',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '10 tablets'
  },
  {
    id: 'drug-055',
    nameAR: 'سيبروباي',
    nameEN: 'Ciprobay',
    activeIngredient: 'Ciprofloxacin 500mg',
    manufacturer: 'Bayer',
    egyptianBarcode: '6221100035001',
    categoryID: 'cat-006',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '10 tablets'
  },
  {
    id: 'drug-056',
    nameAR: 'سيبروباي شراب',
    nameEN: 'Ciprobay Syrup',
    activeIngredient: 'Ciprofloxacin 250mg/5ml',
    manufacturer: 'Bayer',
    egyptianBarcode: '6221100035002',
    categoryID: 'cat-006',
    type: 'Syrup',
    dosage: '250mg/5ml',
    packaging: '100ml bottle'
  },
  // مضادات الميكروبات
  {
    id: 'drug-057',
    nameAR: 'فلاجيل',
    nameEN: 'Flagyl',
    activeIngredient: 'Metronidazole 500mg',
    manufacturer: 'Sanofi',
    egyptianBarcode: '6221100036001',
    categoryID: 'cat-007',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-058',
    nameAR: 'فلاجيل شراب',
    nameEN: 'Flagyl Syrup',
    activeIngredient: 'Metronidazole 100mg/5ml',
    manufacturer: 'Sanofi',
    egyptianBarcode: '6221100036002',
    categoryID: 'cat-007',
    type: 'Syrup',
    dosage: '100mg/5ml',
    packaging: '120ml bottle'
  },
  {
    id: 'drug-059',
    nameAR: 'أنتينال',
    nameEN: 'Antinal',
    activeIngredient: 'Nifuroxazide 100mg',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100037001',
    categoryID: 'cat-007',
    type: 'Capsule',
    dosage: '100mg',
    packaging: '20 capsules'
  },
  {
    id: 'drug-060',
    nameAR: 'أنتينال شراب',
    nameEN: 'Antinal Syrup',
    activeIngredient: 'Nifuroxazide 50mg/5ml',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100037002',
    categoryID: 'cat-007',
    type: 'Syrup',
    dosage: '50mg/5ml',
    packaging: '120ml bottle'
  },
  {
    id: 'drug-061',
    nameAR: 'إيموديوم',
    nameEN: 'Imodium',
    activeIngredient: 'Loperamide 2mg',
    manufacturer: 'Janssen',
    egyptianBarcode: '6221100038001',
    categoryID: 'cat-007',
    type: 'Tablet',
    dosage: '2mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-062',
    nameAR: 'إيموديوم شراب',
    nameEN: 'Imodium Syrup',
    activeIngredient: 'Loperamide 0.2mg/ml',
    manufacturer: 'Janssen',
    egyptianBarcode: '6221100038002',
    categoryID: 'cat-007',
    type: 'Syrup',
    dosage: '0.2mg/ml',
    packaging: '100ml bottle'
  },
  // أدوية الجهاز التنفسي
  {
    id: 'drug-063',
    nameAR: 'فنتولين',
    nameEN: 'Ventolin',
    activeIngredient: 'Salbutamol 100mcg',
    manufacturer: 'GlaxoSmithKline',
    egyptianBarcode: '6221100039001',
    categoryID: 'cat-008',
    type: 'Inhaler',
    dosage: '100mcg',
    packaging: '200 doses'
  },
  {
    id: 'drug-064',
    nameAR: 'سيريتايد',
    nameEN: 'Seretide',
    activeIngredient: 'Salmeterol 25mcg + Fluticasone 125mcg',
    manufacturer: 'GlaxoSmithKline',
    egyptianBarcode: '6221100040001',
    categoryID: 'cat-008',
    type: 'Inhaler',
    dosage: '25mcg+125mcg',
    packaging: '120 doses'
  },
  {
    id: 'drug-065',
    nameAR: 'سيمبيكورت',
    nameEN: 'Symbicort',
    activeIngredient: 'Budesonide 80mcg + Formoterol 4.5mcg',
    manufacturer: 'AstraZeneca',
    egyptianBarcode: '6221100041001',
    categoryID: 'cat-008',
    type: 'Inhaler',
    dosage: '80mcg+4.5mcg',
    packaging: '120 doses'
  },
  {
    id: 'drug-066',
    nameAR: 'بوليميكورت',
    nameEN: 'Pulmicort',
    activeIngredient: 'Budesonide 0.25mg',
    manufacturer: 'AstraZeneca',
    egyptianBarcode: '6221100041500',
    categoryID: 'cat-008',
    type: 'Nebulizer suspension',
    dosage: '0.25mg/ml',
    packaging: '20 vials'
  },
  {
    id: 'drug-067',
    nameAR: 'أتروفنت',
    nameEN: 'Atrovent',
    activeIngredient: 'Ipratropium 20mcg',
    manufacturer: 'Boehringer Ingelheim',
    egyptianBarcode: '6221100042001',
    categoryID: 'cat-008',
    type: 'Inhaler',
    dosage: '20mcg',
    packaging: '200 doses'
  },
  {
    id: 'drug-068',
    nameAR: 'بيسولفون',
    nameEN: 'Bisolvon',
    activeIngredient: 'Bromhexine 8mg',
    manufacturer: 'Boehringer Ingelheim',
    egyptianBarcode: '6221100043001',
    categoryID: 'cat-008',
    type: 'Tablet',
    dosage: '8mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-069',
    nameAR: 'بيسولفون شراب',
    nameEN: 'Bisolvon Syrup',
    activeIngredient: 'Bromhexine 4mg/5ml',
    manufacturer: 'Boehringer Ingelheim',
    egyptianBarcode: '6221100043002',
    categoryID: 'cat-008',
    type: 'Syrup',
    dosage: '4mg/5ml',
    packaging: '100ml bottle'
  },
  {
    id: 'drug-070',
    nameAR: 'برونكيكوم',
    nameEN: 'Bronchicum',
    activeIngredient: 'Thyme Extract',
    manufacturer: 'Pharmaswiss',
    egyptianBarcode: '6221100044001',
    categoryID: 'cat-008',
    type: 'Syrup',
    dosage: 'Extract',
    packaging: '100ml bottle'
  },
  // مضادات الحساسية
  {
    id: 'drug-071',
    nameAR: 'زايرتك',
    nameEN: 'Zyrtec',
    activeIngredient: 'Cetirizine 10mg',
    manufacturer: 'UCB',
    egyptianBarcode: '6221100045001',
    categoryID: 'cat-009',
    type: 'Tablet',
    dosage: '10mg',
    packaging: '10 tablets'
  },
  {
    id: 'drug-072',
    nameAR: 'كسيزال',
    nameEN: 'Xyzal',
    activeIngredient: 'Levocetirizine 5mg',
    manufacturer: 'UCB',
    egyptianBarcode: '6221100045500',
    categoryID: 'cat-009',
    type: 'Tablet',
    dosage: '5mg',
    packaging: '10 tablets'
  },
  {
    id: 'drug-073',
    nameAR: 'كلاريتين',
    nameEN: 'Claritin',
    activeIngredient: 'Loratadine 10mg',
    manufacturer: 'Schering Plough',
    egyptianBarcode: '6221100046001',
    categoryID: 'cat-009',
    type: 'Tablet',
    dosage: '10mg',
    packaging: '10 tablets'
  },
  {
    id: 'drug-074',
    nameAR: 'أيريوس',
    nameEN: 'Aerius',
    activeIngredient: 'Desloratadine 5mg',
    manufacturer: 'Schering Plough',
    egyptianBarcode: '6221100046500',
    categoryID: 'cat-009',
    type: 'Tablet',
    dosage: '5mg',
    packaging: '10 tablets'
  },
  {
    id: 'drug-075',
    nameAR: 'تيلفاست',
    nameEN: 'Telfast',
    activeIngredient: 'Fexofenadine 180mg',
    manufacturer: 'Sanofi',
    egyptianBarcode: '6221100047001',
    categoryID: 'cat-009',
    type: 'Tablet',
    dosage: '180mg',
    packaging: '10 tablets'
  },
  // أدوية الجهاز الهضمي
  {
    id: 'drug-076',
    nameAR: 'كنترولوك',
    nameEN: 'Controloc',
    activeIngredient: 'Pantoprazole 40mg',
    manufacturer: 'Nycomed',
    egyptianBarcode: '6221100048001',
    categoryID: 'cat-010',
    type: 'Tablet',
    dosage: '40mg',
    packaging: '14 tablets'
  },
  {
    id: 'drug-077',
    nameAR: 'نيكسيوم',
    nameEN: 'Nexium',
    activeIngredient: 'Esomeprazole 20mg',
    manufacturer: 'AstraZeneca',
    egyptianBarcode: '6221100048500',
    categoryID: 'cat-010',
    type: 'Capsule',
    dosage: '20mg',
    packaging: '14 capsules'
  },
  {
    id: 'drug-078',
    nameAR: 'لوسيك',
    nameEN: 'Losec',
    activeIngredient: 'Omeprazole 20mg',
    manufacturer: 'AstraZeneca',
    egyptianBarcode: '6221100049001',
    categoryID: 'cat-010',
    type: 'Capsule',
    dosage: '20mg',
    packaging: '14 capsules'
  },
  {
    id: 'drug-079',
    nameAR: 'موتيليوم',
    nameEN: 'Motilium',
    activeIngredient: 'Domperidone 10mg',
    manufacturer: 'Janssen',
    egyptianBarcode: '6221100049500',
    categoryID: 'cat-010',
    type: 'Tablet',
    dosage: '10mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-080',
    nameAR: 'بريمبيران',
    nameEN: 'Primperan',
    activeIngredient: 'Metoclopramide 10mg',
    manufacturer: 'Rhone Poulenc',
    egyptianBarcode: '6221100050001',
    categoryID: 'cat-010',
    type: 'Tablet',
    dosage: '10mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-081',
    nameAR: 'ديسباتالان',
    nameEN: 'Duspatalin',
    activeIngredient: 'Mebeverine 135mg',
    manufacturer: 'Boehringer Ingelheim',
    egyptianBarcode: '6221100050500',
    categoryID: 'cat-010',
    type: 'Capsule',
    dosage: '135mg',
    packaging: '20 capsules'
  },
  {
    id: 'drug-082',
    nameAR: 'بوسكوبان',
    nameEN: 'Buscopan',
    activeIngredient: 'Hyoscine N-Butyl Bromide 10mg',
    manufacturer: 'Boehringer Ingelheim',
    egyptianBarcode: '6221100051001',
    categoryID: 'cat-010',
    type: 'Tablet',
    dosage: '10mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-083',
    nameAR: 'جافيسكون',
    nameEN: 'Gaviscon',
    activeIngredient: 'Magnesium Trisilicate + Aluminum Hydroxide',
    manufacturer: 'RB',
    egyptianBarcode: '6221100051500',
    categoryID: 'cat-010',
    type: 'Suspension',
    dosage: 'Mixed',
    packaging: '200ml bottle'
  },
  // أدوية السكري
  {
    id: 'drug-084',
    nameAR: 'جلوكوفاج',
    nameEN: 'Glucophage',
    activeIngredient: 'Metformin 500mg',
    manufacturer: 'Merck Serono',
    egyptianBarcode: '6221100052001',
    categoryID: 'cat-011',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-085',
    nameAR: 'جلوكوفاج إكس آر',
    nameEN: 'Glucophage XR',
    activeIngredient: 'Metformin Extended Release 500mg',
    manufacturer: 'Merck Serono',
    egyptianBarcode: '6221100052500',
    categoryID: 'cat-011',
    type: 'Tablet',
    dosage: '500mg XR',
    packaging: '14 tablets'
  },
  {
    id: 'drug-086',
    nameAR: 'سيدوفاج',
    nameEN: 'Cidophage',
    activeIngredient: 'Metformin 850mg',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100053001',
    categoryID: 'cat-011',
    type: 'Tablet',
    dosage: '850mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-087',
    nameAR: 'أماريل',
    nameEN: 'Amaryl',
    activeIngredient: 'Glimepiride 2mg',
    manufacturer: 'Sanofi',
    egyptianBarcode: '6221100053500',
    categoryID: 'cat-011',
    type: 'Tablet',
    dosage: '2mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-088',
    nameAR: 'داوينل',
    nameEN: 'Daonil',
    activeIngredient: 'Glyburide 5mg',
    manufacturer: 'Hoechst',
    egyptianBarcode: '6221100054001',
    categoryID: 'cat-011',
    type: 'Tablet',
    dosage: '5mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-089',
    nameAR: 'ديامايكرون',
    nameEN: 'Diamicron',
    activeIngredient: 'Gliclazide 80mg',
    manufacturer: 'Servier',
    egyptianBarcode: '6221100054500',
    categoryID: 'cat-011',
    type: 'Tablet',
    dosage: '80mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-090',
    nameAR: 'جانيوميت',
    nameEN: 'Janumet',
    activeIngredient: 'Sitagliptin 50mg + Metformin 500mg',
    manufacturer: 'MSD',
    egyptianBarcode: '6221100055001',
    categoryID: 'cat-011',
    type: 'Tablet',
    dosage: '50mg+500mg',
    packaging: '14 tablets'
  },
  {
    id: 'drug-091',
    nameAR: 'انسولاتارد',
    nameEN: 'Insulatard',
    activeIngredient: 'Insulin NPH 100 units/ml',
    manufacturer: 'Novo Nordisk',
    egyptianBarcode: '6221100056001',
    categoryID: 'cat-011',
    type: 'Injection',
    dosage: '100 units/ml',
    packaging: '10ml vial'
  },
  {
    id: 'drug-092',
    nameAR: 'لانتس',
    nameEN: 'Lantus',
    activeIngredient: 'Insulin Glargine 100 units/ml',
    manufacturer: 'Sanofi',
    egyptianBarcode: '6221100056500',
    categoryID: 'cat-011',
    type: 'Injection',
    dosage: '100 units/ml',
    packaging: 'Pen 3ml'
  },
  {
    id: 'drug-093',
    nameAR: 'نوفورابيد',
    nameEN: 'Novorapid',
    activeIngredient: 'Insulin Aspart 100 units/ml',
    manufacturer: 'Novo Nordisk',
    egyptianBarcode: '6221100057001',
    categoryID: 'cat-011',
    type: 'Injection',
    dosage: '100 units/ml',
    packaging: 'Pen 3ml'
  },
  {
    id: 'drug-094',
    nameAR: 'ميكستارد',
    nameEN: 'Mixtard',
    activeIngredient: 'Insulin Mix 30/70 100 units/ml',
    manufacturer: 'Novo Nordisk',
    egyptianBarcode: '6221100057500',
    categoryID: 'cat-011',
    type: 'Injection',
    dosage: '100 units/ml',
    packaging: '10ml vial'
  },
  // أدوية القلب والأوعية الدموية
  {
    id: 'drug-095',
    nameAR: 'كونكور',
    nameEN: 'Concor',
    activeIngredient: 'Bisoprolol 5mg',
    manufacturer: 'Merck',
    egyptianBarcode: '6221100058001',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '5mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-096',
    nameAR: 'كونكور 10',
    nameEN: 'Concor 10',
    activeIngredient: 'Bisoprolol 10mg',
    manufacturer: 'Merck',
    egyptianBarcode: '6221100058002',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '10mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-097',
    nameAR: 'بيتالوك',
    nameEN: 'Betaloc',
    activeIngredient: 'Metoprolol 100mg',
    manufacturer: 'AstraZeneca',
    egyptianBarcode: '6221100059001',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '100mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-098',
    nameAR: 'سيلوكين',
    nameEN: 'Seloken',
    activeIngredient: 'Metoprolol 100mg',
    manufacturer: 'AstraZeneca',
    egyptianBarcode: '6221100059500',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '100mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-099',
    nameAR: 'أتينو',
    nameEN: 'Ateno',
    activeIngredient: 'Atenolol 50mg',
    manufacturer: 'Various',
    egyptianBarcode: '6221100060001',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '50mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-100',
    nameAR: 'نورموتين',
    nameEN: 'Normoten',
    activeIngredient: 'Atenolol 50mg',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100060500',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '50mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-101',
    nameAR: 'نورفاسك',
    nameEN: 'Norvasc',
    activeIngredient: 'Amlodipine 5mg',
    manufacturer: 'Pfizer',
    egyptianBarcode: '6221100061001',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '5mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-102',
    nameAR: 'أملور',
    nameEN: 'Amlor',
    activeIngredient: 'Amlodipine 5mg',
    manufacturer: 'Various',
    egyptianBarcode: '6221100061500',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '5mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-103',
    nameAR: 'أدالات',
    nameEN: 'Adalat',
    activeIngredient: 'Nifedipine 10mg',
    manufacturer: 'Bayer',
    egyptianBarcode: '6221100062001',
    categoryID: 'cat-012',
    type: 'Capsule',
    dosage: '10mg',
    packaging: '30 capsules'
  },
  {
    id: 'drug-104',
    nameAR: 'تاريج',
    nameEN: 'Tareg',
    activeIngredient: 'Losartan 50mg',
    manufacturer: 'MSD',
    egyptianBarcode: '6221100062500',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '50mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-105',
    nameAR: 'ديوفان',
    nameEN: 'Diovan',
    activeIngredient: 'Valsartan 80mg',
    manufacturer: 'Novartis',
    egyptianBarcode: '6221100063001',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '80mg',
    packaging: '14 tablets'
  },
  {
    id: 'drug-106',
    nameAR: 'لاسيكس',
    nameEN: 'Lasix',
    activeIngredient: 'Furosemide 40mg',
    manufacturer: 'Hoechst',
    egyptianBarcode: '6221100063500',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '40mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-107',
    nameAR: 'ألداكتون',
    nameEN: 'Aldactone',
    activeIngredient: 'Spironolactone 25mg',
    manufacturer: 'Pfizer',
    egyptianBarcode: '6221100064001',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '25mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-108',
    nameAR: 'أسبرين بروتيكت',
    nameEN: 'Aspirin Protect',
    activeIngredient: 'Aspirin 100mg',
    manufacturer: 'Bayer',
    egyptianBarcode: '6221100064500',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '100mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-109',
    nameAR: 'بلافيكس',
    nameEN: 'Plavix',
    activeIngredient: 'Clopidogrel 75mg',
    manufacturer: 'Bristol Myers Squibb',
    egyptianBarcode: '6221100065001',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '75mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-110',
    nameAR: 'كليكسان',
    nameEN: 'Clexane',
    activeIngredient: 'Enoxaparin 40mg',
    manufacturer: 'Sanofi',
    egyptianBarcode: '6221100065500',
    categoryID: 'cat-012',
    type: 'Injection',
    dosage: '40mg/0.4ml',
    packaging: 'Syringe'
  },
  {
    id: 'drug-111',
    nameAR: 'ديجوكسين',
    nameEN: 'Digoxin',
    activeIngredient: 'Digoxin 0.25mg',
    manufacturer: 'Various',
    egyptianBarcode: '6221100066001',
    categoryID: 'cat-012',
    type: 'Tablet',
    dosage: '0.25mg',
    packaging: '30 tablets'
  },
  // خافضات الكوليسترول
  {
    id: 'drug-112',
    nameAR: 'أتورفاستاتين',
    nameEN: 'Atorvastatin',
    activeIngredient: 'Atorvastatin 20mg',
    manufacturer: 'Various',
    egyptianBarcode: '6221100067001',
    categoryID: 'cat-013',
    type: 'Tablet',
    dosage: '20mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-113',
    nameAR: 'روسوفاستاتين',
    nameEN: 'Rosuvastatin',
    activeIngredient: 'Rosuvastatin 20mg',
    manufacturer: 'Various',
    egyptianBarcode: '6221100067500',
    categoryID: 'cat-013',
    type: 'Tablet',
    dosage: '20mg',
    packaging: '28 tablets'
  },
  {
    id: 'drug-114',
    nameAR: 'سيمفاستاتين',
    nameEN: 'Simvastatin',
    activeIngredient: 'Simvastatin 20mg',
    manufacturer: 'Merck',
    egyptianBarcode: '6221100068001',
    categoryID: 'cat-013',
    type: 'Tablet',
    dosage: '20mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-115',
    nameAR: 'برافاستاتين',
    nameEN: 'Pravastatin',
    activeIngredient: 'Pravastatin 20mg',
    manufacturer: 'Bristol Myers',
    egyptianBarcode: '6221100068500',
    categoryID: 'cat-013',
    type: 'Tablet',
    dosage: '20mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-116',
    nameAR: 'لوفاستاتين',
    nameEN: 'Lovastatin',
    activeIngredient: 'Lovastatin 20mg',
    manufacturer: 'Merck',
    egyptianBarcode: '6221100069001',
    categoryID: 'cat-013',
    type: 'Tablet',
    dosage: '20mg',
    packaging: '30 tablets'
  },
  // أدوية الجهاز العصبي والنفسي
  {
    id: 'drug-117',
    nameAR: 'لوسترال',
    nameEN: 'Lustral',
    activeIngredient: 'Sertraline 50mg',
    manufacturer: 'Pfizer',
    egyptianBarcode: '6221100070001',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '50mg',
    packaging: '14 tablets'
  },
  {
    id: 'drug-118',
    nameAR: 'بروزاك',
    nameEN: 'Prozac',
    activeIngredient: 'Fluoxetine 20mg',
    manufacturer: 'Eli Lilly',
    egyptianBarcode: '6221100070500',
    categoryID: 'cat-014',
    type: 'Capsule',
    dosage: '20mg',
    packaging: '14 capsules'
  },
  {
    id: 'drug-119',
    nameAR: 'سيبراليكس',
    nameEN: 'Cipralex',
    activeIngredient: 'Escitalopram 10mg',
    manufacturer: 'Lundbeck',
    egyptianBarcode: '6221100071001',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '10mg',
    packaging: '28 tablets'
  },
  {
    id: 'drug-120',
    nameAR: 'سيرجيستا',
    nameEN: 'Seresta',
    activeIngredient: 'Citalopram 20mg',
    manufacturer: 'Lundbeck',
    egyptianBarcode: '6221100071500',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '20mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-121',
    nameAR: 'سيروكساط',
    nameEN: 'Seroxat',
    activeIngredient: 'Paroxetine 20mg',
    manufacturer: 'GlaxoSmithKline',
    egyptianBarcode: '6221100072001',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '20mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-122',
    nameAR: 'أناف رانيل',
    nameEN: 'Anafranil',
    activeIngredient: 'Clomipramine 25mg',
    manufacturer: 'Novartis',
    egyptianBarcode: '6221100072500',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '25mg',
    packaging: '14 tablets'
  },
  {
    id: 'drug-123',
    nameAR: 'توفرانيل',
    nameEN: 'Tofranil',
    activeIngredient: 'Imipramine 25mg',
    manufacturer: 'Novartis',
    egyptianBarcode: '6221100073001',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '25mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-124',
    nameAR: 'زاناكس',
    nameEN: 'Xanax',
    activeIngredient: 'Alprazolam 0.25mg',
    manufacturer: 'Pfizer',
    egyptianBarcode: '6221100073500',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '0.25mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-125',
    nameAR: 'فاليوم',
    nameEN: 'Valium',
    activeIngredient: 'Diazepam 5mg',
    manufacturer: 'Roche',
    egyptianBarcode: '6221100074001',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '5mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-126',
    nameAR: 'ريفوتريل',
    nameEN: 'Rivotril',
    activeIngredient: 'Clonazepam 0.5mg',
    manufacturer: 'Roche',
    egyptianBarcode: '6221100074500',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '0.5mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-127',
    nameAR: 'ليكسوتانيل',
    nameEN: 'Lexotanil',
    activeIngredient: 'Bromazepam 3mg',
    manufacturer: 'Roche',
    egyptianBarcode: '6221100075001',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '3mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-128',
    nameAR: 'دوجماتيل',
    nameEN: 'Dogmatil',
    activeIngredient: 'Sulpiride 50mg',
    manufacturer: 'Aventis',
    egyptianBarcode: '6221100075500',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '50mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-129',
    nameAR: 'ديانكسيت',
    nameEN: 'Deanxit',
    activeIngredient: 'Flupentixol 0.5mg + Melitracen 10mg',
    manufacturer: 'Lundbeck',
    egyptianBarcode: '6221100076001',
    categoryID: 'cat-014',
    type: 'Tablet',
    dosage: '0.5mg+10mg',
    packaging: '20 tablets'
  },
  // أدوية الغدد الصماء
  {
    id: 'drug-130',
    nameAR: 'ليفوثيروكسين',
    nameEN: 'Levothyroxine',
    activeIngredient: 'Levothyroxine 100mcg',
    manufacturer: 'Various',
    egyptianBarcode: '6221100077001',
    categoryID: 'cat-015',
    type: 'Tablet',
    dosage: '100mcg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-131',
    nameAR: 'بريمولوت إن',
    nameEN: 'Primolut N',
    activeIngredient: 'Norethisterone 5mg',
    manufacturer: 'Bayer',
    egyptianBarcode: '6221100077500',
    categoryID: 'cat-015',
    type: 'Tablet',
    dosage: '5mg',
    packaging: '10 tablets'
  },
  {
    id: 'drug-132',
    nameAR: 'سيكلو بروجينوفا',
    nameEN: 'Cyclo-Progynova',
    activeIngredient: 'Estradiol + Norgestrel',
    manufacturer: 'Bayer',
    egyptianBarcode: '6221100078001',
    categoryID: 'cat-015',
    type: 'Tablet',
    dosage: 'Mixed',
    packaging: '21 tablets'
  },
  {
    id: 'drug-133',
    nameAR: 'جينيرا',
    nameEN: 'Gynera',
    activeIngredient: 'Desogestrel + Ethinyl Estradiol',
    manufacturer: 'Schering',
    egyptianBarcode: '6221100078500',
    categoryID: 'cat-015',
    type: 'Tablet',
    dosage: 'Mixed',
    packaging: '21 tablets'
  },
  {
    id: 'drug-134',
    nameAR: 'ياسمين',
    nameEN: 'Yasmin',
    activeIngredient: 'Drospirenone 3mg + Ethinyl Estradiol 30mcg',
    manufacturer: 'Bayer',
    egyptianBarcode: '6221100079001',
    categoryID: 'cat-015',
    type: 'Tablet',
    dosage: '3mg+30mcg',
    packaging: '21 tablets'
  },
  {
    id: 'drug-135',
    nameAR: 'مارفيلون',
    nameEN: 'Marvelon',
    activeIngredient: 'Desogestrel 150mcg + Ethinyl Estradiol 30mcg',
    manufacturer: 'Schering',
    egyptianBarcode: '6221100079500',
    categoryID: 'cat-015',
    type: 'Tablet',
    dosage: '150mcg+30mcg',
    packaging: '21 tablets'
  },
  // الفيتامينات والمكملات
  {
    id: 'drug-136',
    nameAR: 'سنتروم',
    nameEN: 'Centrum',
    activeIngredient: 'Multi-Vitamin & Mineral Complex',
    manufacturer: 'Pfizer',
    egyptianBarcode: '6221100080001',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'Complex',
    packaging: '30 tablets'
  },
  {
    id: 'drug-137',
    nameAR: 'سنتروم سيلفر',
    nameEN: 'Centrum Silver',
    activeIngredient: 'Multi-Vitamin & Mineral for 50+',
    manufacturer: 'Pfizer',
    egyptianBarcode: '6221100080500',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'Complex',
    packaging: '30 tablets'
  },
  {
    id: 'drug-138',
    nameAR: 'بيكوزيم',
    nameEN: 'Becozyme',
    activeIngredient: 'Vitamin B Complex',
    manufacturer: 'Bayer',
    egyptianBarcode: '6221100081001',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'B Complex',
    packaging: '20 tablets'
  },
  {
    id: 'drug-139',
    nameAR: 'بيكوزيم فورت',
    nameEN: 'Becozyme Forte',
    activeIngredient: 'Vitamin B Complex Strong',
    manufacturer: 'Bayer',
    egyptianBarcode: '6221100081002',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'B Complex',
    packaging: '20 tablets'
  },
  {
    id: 'drug-140',
    nameAR: 'كالترات',
    nameEN: 'Caltrate',
    activeIngredient: 'Calcium Carbonate 1200mg + Vitamin D 800 IU',
    manufacturer: 'Pfizer',
    egyptianBarcode: '6221100082001',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: '1200mg+800 IU',
    packaging: '30 tablets'
  },
  {
    id: 'drug-141',
    nameAR: 'كالسيماج',
    nameEN: 'Calcimag',
    activeIngredient: 'Calcium + Magnesium',
    manufacturer: 'EIPICO',
    egyptianBarcode: '6221100082500',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'Mixed',
    packaging: '20 tablets'
  },
  {
    id: 'drug-142',
    nameAR: 'نيوراتون',
    nameEN: 'Neuroton',
    activeIngredient: 'Vitamin B Complex (B1, B6, B12)',
    manufacturer: 'Egyptian Pharma',
    egyptianBarcode: '6221100083001',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'B Complex',
    packaging: '20 tablets'
  },
  {
    id: 'drug-143',
    nameAR: 'نيوروروبين',
    nameEN: 'Neurorubine',
    activeIngredient: 'Vitamin B Complex with Pyridoxine',
    manufacturer: 'Merck',
    egyptianBarcode: '6221100083500',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'B Complex',
    packaging: '10 tablets'
  },
  {
    id: 'drug-144',
    nameAR: 'ميلجا',
    nameEN: 'Milga',
    activeIngredient: 'Vitamin B1 + B6 + B12',
    manufacturer: 'Merck',
    egyptianBarcode: '6221100084001',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'B1+B6+B12',
    packaging: '20 tablets'
  },
  {
    id: 'drug-145',
    nameAR: 'ميلجا أدفانس',
    nameEN: 'Milga Advance',
    activeIngredient: 'Vitamin B Complex Advanced',
    manufacturer: 'Merck',
    egyptianBarcode: '6221100084002',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'B Complex',
    packaging: '20 tablets'
  },
  {
    id: 'drug-146',
    nameAR: 'فيتاسيد سي',
    nameEN: 'Vitacid C',
    activeIngredient: 'Vitamin C 500mg',
    manufacturer: 'Various',
    egyptianBarcode: '6221100084500',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '30 tablets'
  },
  {
    id: 'drug-147',
    nameAR: 'سي ريتارد',
    nameEN: 'C-Retard',
    activeIngredient: 'Vitamin C Extended Release 500mg',
    manufacturer: 'Various',
    egyptianBarcode: '6221100085001',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: '500mg',
    packaging: '20 tablets'
  },
  {
    id: 'drug-148',
    nameAR: 'فيتازينك',
    nameEN: 'Vitazinc',
    activeIngredient: 'Zinc + Vitamin C',
    manufacturer: 'Various',
    egyptianBarcode: '6221100085500',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'Mixed',
    packaging: '30 tablets'
  },
  {
    id: 'drug-149',
    nameAR: 'سوبرافيت',
    nameEN: 'Supravit',
    activeIngredient: 'Multi-Vitamin Complex',
    manufacturer: 'Pharmaswiss',
    egyptianBarcode: '6221100086001',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'Complex',
    packaging: '30 tablets'
  },
  {
    id: 'drug-150',
    nameAR: 'ويلمان',
    nameEN: 'Wellman',
    activeIngredient: 'Men Multi-Vitamin',
    manufacturer: 'Vitabiotics',
    egyptianBarcode: '6221100086500',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'Complex',
    packaging: '30 tablets'
  },
  {
    id: 'drug-151',
    nameAR: 'ويلووومان',
    nameEN: 'Wellwoman',
    activeIngredient: 'Women Multi-Vitamin',
    manufacturer: 'Vitabiotics',
    egyptianBarcode: '6221100087001',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'Complex',
    packaging: '30 tablets'
  },
  {
    id: 'drug-152',
    nameAR: 'بيرفيكتيل',
    nameEN: 'Perfectil',
    activeIngredient: 'Beauty Multi-Vitamin',
    manufacturer: 'Vitabiotics',
    egyptianBarcode: '6221100087500',
    categoryID: 'cat-016',
    type: 'Tablet',
    dosage: 'Complex',
    packaging: '30 tablets'
  }
];

// Helper function to search Egyptian drugs
export function searchEgyptianDrugs(query: string, searchField: 'nameAR' | 'nameEN' | 'activeIngredient' | 'egyptianBarcode' = 'nameAR'): EgyptianDrugData[] {
  const lowerQuery = query.toLowerCase();
  return egyptianDrugs.filter(drug => {
    const fieldValue = drug[searchField]?.toLowerCase() || '';
    return fieldValue.includes(lowerQuery);
  });
}

// Helper function to get drugs by category
export function getEgyptianDrugsByCategory(categoryId: string): EgyptianDrugData[] {
  return egyptianDrugs.filter(drug => drug.categoryID === categoryId);
}

// Helper function to get drug by barcode
export function getEgyptianDrugByBarcode(barcode: string): EgyptianDrugData | undefined {
  return egyptianDrugs.find(drug => drug.egyptianBarcode === barcode);
}

// Export metadata
export const egyptianDrugsMetadata = {
  totalCategories: drugCategories.length,
  totalDrugs: egyptianDrugs.length,
  barcodePrefix: '6221',
  lastUpdated: new Date().toISOString()
};
