// Job status lifecycle
const JOB_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Application status lifecycle
const APPLICATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

// Transaction / escrow status
const TRANSACTION_STATUS = {
  HELD_IN_ESCROW: 'held_in_escrow',
  RELEASED: 'released',
  REFUNDED: 'refunded',
};

// Worker verification status
const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

// User modes
const USER_MODE = {
  WORKER: 'worker',
  POSTER: 'poster',
};

// Safety event status
const SAFETY_STATUS = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged_by_admin',
  RESOLVED: 'resolved',
  FALSE_ALARM: 'false_alarm',
};

// Job categories (fixed list for MVP; admin can add more via Category model)
const DEFAULT_CATEGORIES = [
  { name: 'Cleaning', icon: 'broom' },
  { name: 'Cooking', icon: 'chef-hat' },
  { name: 'Kitchen Deep Clean', icon: 'sink' },
  { name: 'Gardening & Planting', icon: 'flower' },
  { name: 'Laundry', icon: 'shirt' },
  { name: 'General Help', icon: 'hand-helping' },
];

// ID document types accepted for worker verification
const ID_TYPES = ['aadhaar', 'voter_id', 'passport', 'driving_license', 'pan'];

module.exports = {
  JOB_STATUS,
  APPLICATION_STATUS,
  TRANSACTION_STATUS,
  VERIFICATION_STATUS,
  USER_MODE,
  SAFETY_STATUS,
  DEFAULT_CATEGORIES,
  ID_TYPES,
};
