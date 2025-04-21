module.exports = {
  signInWithEmailAndPassword: jest.fn(async () => ({ user: { uid: 'mock-user' } })),
  signOut: jest.fn(async () => undefined),
  onAuthStateChanged: jest.fn((cb) => cb({ uid: 'mock-user' })),
};
