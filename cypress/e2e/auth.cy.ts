import { describe, it, expect, beforeEach } from 'cypress';

describe('Authentication Flow', () => {
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    username: `testuser_${Date.now()}`,
    password: 'TestPassword123!',
  };

  beforeEach(() => {
    cy.clearAuth();
  });

  it('should register a new user', () => {
    cy.visit('/register');

    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="username"]').type(testUser.username);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/register');
    cy.window().its('localStorage').invoke('getItem', 'fretflow_refresh_token').should('exist');
  });

  it('should login with valid credentials', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login');
    cy.window().its('localStorage').invoke('getItem', 'fretflow_refresh_token').should('exist');
  });

  it('should show error with invalid credentials', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').type('wrong@test.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.contains(/invalid|error|failed/i).should('be.visible');
  });

  it('should logout', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login');

    cy.get('button[data-testid="logout-button"], button:contains("Logout"), button:contains("Sign Out")').first().click();

    cy.window().its('localStorage').invoke('getItem', 'fretflow_refresh_token').should('be.null');
  });

  it('should persist session after page reload', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login');
    cy.reload();
    cy.url().should('not.include', '/login');
  });
});