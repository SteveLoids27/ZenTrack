import { API_URL } from '../config';

describe('api client config', () => {
  it('has a default API URL', () => {
    expect(API_URL).toBeTruthy();
    expect(typeof API_URL).toBe('string');
  });
});
