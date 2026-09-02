// ─── Mock Users ───────────────────────────────────────────────────────────────
export const MOCK_USERS = [
  {
    id: 'u1', name: 'Maria Santos', email: 'maria@email.com', password: '123456',
    role: 'community', avatar: null, location: 'Cebu City', joinedAt: '2026-01-10',
  },
  {
    id: 'u2', name: 'Juan dela Cruz', email: 'juan@email.com', password: '123456',
    role: 'advocate', avatar: null, location: 'Mandaue City',
    organization: 'Cebu Animal Rescue Network', joinedAt: '2025-11-05', rescueCount: 14,
  },
  {
    id: 'u3', name: 'Ana Reyes', email: 'ana@email.com', password: '123456',
    role: 'community', avatar: null, location: 'Lapu-Lapu City', joinedAt: '2026-03-22',
  },
];

// ─── Mock Rescue Reports ──────────────────────────────────────────────────────
export const MOCK_RESCUE_REPORTS = [
  {
    id: 'r1', reporterId: 'u1', reporterName: 'Maria Santos',
    animalType: 'Dog', condition: 'Injured', urgency: 'High',
    description: 'Found a dog with a wounded leg near the market. It cannot walk properly and seems to be in pain.',
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
    location: { latitude: 10.3157, longitude: 123.8854, address: 'Carbon Market, Cebu City' },
    status: 'Open', createdAt: '2026-08-26T07:30:00Z', responderId: null,
    comments: [{ id: 'c1', userId: 'u2', userName: 'Juan dela Cruz', text: 'On my way to check this out!', createdAt: '2026-08-26T07:45:00Z' }],
  },
  {
    id: 'r2', reporterId: 'u3', reporterName: 'Ana Reyes',
    animalType: 'Cat', condition: 'Abandoned', urgency: 'Medium',
    description: 'A small kitten abandoned in a box outside a convenience store. Seems hungry but otherwise okay.',
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80',
    location: { latitude: 10.3107, longitude: 123.9400, address: 'Lapu-Lapu City Boulevard' },
    status: 'Responded', createdAt: '2026-08-25T14:00:00Z', responderId: 'u2', comments: [],
  },
  {
    id: 'r3', reporterId: 'u1', reporterName: 'Maria Santos',
    animalType: 'Dog', condition: 'Stray', urgency: 'Low',
    description: 'Skinny stray dog wandering near the school area. Very thin but no visible injuries.',
    photo: 'https://images.unsplash.com/photo-1534361960057-19f4434a4f8a?w=600&q=80',
    location: { latitude: 10.3200, longitude: 123.9000, address: 'Capitol Site, Cebu City' },
    status: 'Rescued', createdAt: '2026-08-20T09:00:00Z', responderId: 'u2', comments: [],
  },
];

// ─── Mock Animal Profiles ─────────────────────────────────────────────────────
// status values:
//   'Available'       → shows in Adopt & Foster listings (open for adoption OR foster)
//   'Being Fostered'  → currently with a foster carer, hidden from listings
//   'Adopted'         → permanently rehomed, hidden from listings
//   'Under Care'      → not ready yet, hidden from listings
//
// listingType:
//   'Adoption'  → advocate wants a permanent home
//   'Foster'    → advocate wants a temporary carer
//   'Both'      → open to either
//
// fosterDuration (only relevant when listingType is 'Foster' or 'Both'):
//   e.g. '1 month', '2–3 months', 'Until adopted', 'Flexible'

export const MOCK_ANIMALS = [
  {
    id: 'a1', advocateId: 'u2', advocateName: 'Juan dela Cruz',
    name: 'Bantay', species: 'Dog', breed: 'Aspin', age: '~2 years',
    gender: 'Male', color: 'Brown & White', condition: 'Recovering',
    vaccinated: true, neutered: false,
    description: 'Bantay was rescued from Carbon Market with a leg injury. He is currently recovering well and is very friendly.',
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
    status: 'Available',
    listingType: 'Adoption',
    fosterDuration: null,
    fosterId: null,
    fosterName: null,
    rescueReportId: 'r1',
    createdAt: '2026-08-23T10:00:00Z',
    tags: ['Friendly', 'Good with kids'],
  },
  {
    id: 'a2', advocateId: 'u2', advocateName: 'Juan dela Cruz',
    name: 'Mimi', species: 'Cat', breed: 'Domestic Shorthair', age: '~3 months',
    gender: 'Female', color: 'Orange Tabby', condition: 'Healthy',
    vaccinated: false, neutered: false,
    description: 'Mimi is a tiny kitten found abandoned in Lapu-Lapu City. She is playful, curious, and loves attention. She is too young for permanent adoption right now.',
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80',
    status: 'Available',
    listingType: 'Foster',
    fosterDuration: '2–3 months',
    fosterId: null,
    fosterName: null,
    rescueReportId: 'r2',
    createdAt: '2026-08-25T16:00:00Z',
    tags: ['Playful', 'Kitten', 'Indoor'],
  },
  {
    id: 'a3', advocateId: 'u2', advocateName: 'Juan dela Cruz',
    name: 'Tuko', species: 'Dog', breed: 'Aspin', age: '~4 years',
    gender: 'Male', color: 'Black', condition: 'Healthy',
    vaccinated: true, neutered: true,
    description: 'Tuko is a calm and well-behaved dog. He was a stray for a long time but has adjusted well. Great companion.',
    photo: 'https://images.unsplash.com/photo-1534361960057-19f4434a4f8a?w=600&q=80',
    status: 'Available',
    listingType: 'Both',
    fosterDuration: 'Flexible',
    fosterId: null,
    fosterName: null,
    rescueReportId: 'r3',
    createdAt: '2026-08-22T08:00:00Z',
    tags: ['Calm', 'Trained', 'Good with dogs'],
  },
];

// ─── Mock Requests ────────────────────────────────────────────────────────────
export const MOCK_REQUESTS = [
  {
    id: 'req1', animalId: 'a1', animalName: 'Bantay',
    requesterId: 'u1', requesterName: 'Maria Santos', advocateId: 'u2',
    type: 'Adoption',
    message: 'I have a big yard and love dogs. I would give Bantay a great forever home!',
    commitDuration: null,
    status: 'Pending', createdAt: '2026-08-24T11:00:00Z',
  },
  {
    id: 'req2', animalId: 'a2', animalName: 'Mimi',
    requesterId: 'u3', requesterName: 'Ana Reyes', advocateId: 'u2',
    type: 'Foster',
    message: 'I can foster Mimi for 2 months while she grows up. I have experience with kittens.',
    commitDuration: '2 months',
    status: 'Pending', createdAt: '2026-08-26T08:00:00Z',
  },
];

// ─── Mock Conversations ───────────────────────────────────────────────────────
export const MOCK_CONVERSATIONS = [
  {
    id: 'conv1', participants: ['u1', 'u2'],
    participantNames: { u1: 'Maria Santos', u2: 'Juan dela Cruz' },
    lastMessage: 'Thank you for responding so quickly!', lastMessageTime: '2026-08-26T08:10:00Z',
    messages: [
      { id: 'm1', senderId: 'u2', text: 'Hi Maria, I have responded to your rescue report for the injured dog.', time: '2026-08-26T07:50:00Z' },
      { id: 'm2', senderId: 'u1', text: 'Thank you for responding so quickly!', time: '2026-08-26T08:10:00Z' },
      { id: 'm3', senderId: 'u2', text: 'I will pick up the dog this afternoon. Please keep an eye on it if you can.', time: '2026-08-26T08:12:00Z' },
    ],
  },
  {
    id: 'conv2', participants: ['u3', 'u2'],
    participantNames: { u3: 'Ana Reyes', u2: 'Juan dela Cruz' },
    lastMessage: 'Yes, she is doing great!', lastMessageTime: '2026-08-26T09:00:00Z',
    messages: [
      { id: 'm4', senderId: 'u3', text: 'Hi! I submitted a foster request for Mimi. Is she still available?', time: '2026-08-26T08:30:00Z' },
      { id: 'm5', senderId: 'u2', text: 'Yes, she is doing great!', time: '2026-08-26T09:00:00Z' },
    ],
  },
];

// ─── Mock Donations ───────────────────────────────────────────────────────────
export const MOCK_DONATIONS = [
  {
    id: 'd1', donorId: 'u1', donorName: 'Maria Santos',
    animalId: 'a1', animalName: 'Bantay', amount: 500,
    method: 'GCash', referenceNumber: 'GC20260826001', proofPhoto: null,
    message: "For Bantay's medical treatment. Get well soon!",
    status: 'Verified', createdAt: '2026-08-25T10:00:00Z',
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────
export const URGENCY_LEVELS = [
  { label: 'High',   color: '#D93025', bg: '#FDE8E7' },
  { label: 'Medium', color: '#F5A623', bg: '#FEF3E2' },
  { label: 'Low',    color: '#27AE60', bg: '#E8F5EE' },
];

export const ANIMAL_SPECIES    = ['Dog', 'Cat', 'Other'];
export const ANIMAL_CONDITIONS = ['Injured', 'Stray', 'Abandoned', 'Malnourished', 'Sick', 'Healthy', 'Other'];
export const FOSTER_DURATIONS  = ['1 month', '2 months', '3 months', '4–6 months', 'Until adopted', 'Flexible'];
export const PAYMENT_METHODS   = ['GCash', 'Maya', 'Bank Transfer', 'Cash'];

// Minimal color refs used below (avoids importing COLORS into mockData)
const COLORS_NOTIF = {
  primaryDeep: '#2E7A99',
  tagBg:       '#E0F2FA',
};

// ─── Mock Notifications ───────────────────────────────────────────────────────
// type: 'request' | 'response' | 'comment' | 'message' | 'donation' | 'approval'
export const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    userId:   'u1',          // who receives this
    type:     'response',
    title:    'Rescue Responded',
    body:     'Juan dela Cruz responded to your rescue report for the injured dog near Carbon Market.',
    icon:     'shield-checkmark',
    iconBg:   '#D8F0E4',
    iconColor:'#2D9E5F',
    read:     false,
    createdAt:'2026-08-26T07:50:00Z',
    navTarget:{ screen: 'ReportDetail', params: { reportId: 'r1' } },
  },
  {
    id: 'n2',
    userId:   'u1',
    type:     'comment',
    title:    'New Comment',
    body:     'Juan dela Cruz commented on your rescue report: "On my way to check this out!"',
    icon:     'chatbubble',
    iconBg:   COLORS_NOTIF.tagBg,
    iconColor:COLORS_NOTIF.primaryDeep,
    read:     false,
    createdAt:'2026-08-26T07:45:00Z',
    navTarget:{ screen: 'ReportDetail', params: { reportId: 'r1' } },
  },
  {
    id: 'n3',
    userId:   'u2',          // advocate
    type:     'request',
    title:    'Adoption Request',
    body:     'Maria Santos submitted an adoption request for Bantay.',
    icon:     'home',
    iconBg:   COLORS_NOTIF.tagBg,
    iconColor:COLORS_NOTIF.primaryDeep,
    read:     false,
    createdAt:'2026-08-24T11:00:00Z',
    navTarget:{ screen: 'AdvocateRequests', params: {} },
  },
  {
    id: 'n4',
    userId:   'u2',
    type:     'request',
    title:    'Foster Request',
    body:     'Ana Reyes submitted a foster request for Mimi. She can commit for 2 months.',
    icon:     'heart',
    iconBg:   '#FEF3DC',
    iconColor:'#B45309',
    read:     false,
    createdAt:'2026-08-26T08:00:00Z',
    navTarget:{ screen: 'AdvocateRequests', params: {} },
  },
  {
    id: 'n5',
    userId:   'u1',
    type:     'approval',
    title:    'Request Approved!',
    body:     'Your adoption request for Bantay has been approved by Juan dela Cruz. Check your messages.',
    icon:     'checkmark-circle',
    iconBg:   '#D8F0E4',
    iconColor:'#2D9E5F',
    read:     true,
    createdAt:'2026-08-24T15:00:00Z',
    navTarget:{ screen: 'Messages', params: {} },
  },
  {
    id: 'n6',
    userId:   'u1',
    type:     'message',
    title:    'New Message',
    body:     'Juan dela Cruz: "I will pick up the dog this afternoon. Please keep an eye on it."',
    icon:     'chatbubbles',
    iconBg:   COLORS_NOTIF.tagBg,
    iconColor:COLORS_NOTIF.primaryDeep,
    read:     true,
    createdAt:'2026-08-26T08:12:00Z',
    navTarget:{ screen: 'Chat', params: { conversationId: 'conv1', name: 'Juan dela Cruz' } },
  },
  {
    id: 'n7',
    userId:   'u2',
    type:     'donation',
    title:    'Donation Received',
    body:     'Maria Santos donated ₱500 for Bantay\'s medical treatment.',
    icon:     'gift',
    iconBg:   '#D4EDE1',
    iconColor:'#5A9478',
    read:     true,
    createdAt:'2026-08-25T10:00:00Z',
    navTarget:{ screen: 'Activity', params: { tab: 'donations' } },
  },
  {
    id: 'n8',
    userId:   'u3',
    type:     'approval',
    title:    'Foster Request Approved!',
    body:     'Your foster request for Mimi has been approved! Check your messages to coordinate the handover.',
    icon:     'checkmark-circle',
    iconBg:   '#D8F0E4',
    iconColor:'#2D9E5F',
    read:     false,
    createdAt:'2026-08-26T09:15:00Z',
    navTarget:{ screen: 'Chat', params: { conversationId: 'conv2', name: 'Juan dela Cruz' } },
  },
];
