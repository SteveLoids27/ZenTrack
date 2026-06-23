describe('config', () => {
  it('has a default API URL', () => {
    const { API_URL } = require('./config');
    expect(API_URL).toBeTruthy();
    expect(typeof API_URL).toBe('string');
  });
});
