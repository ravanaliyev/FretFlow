import '@testing-library/cypress/add-commands';

// Custom commands for FretFlow
declare global {
  namespace Cypress {
    interface Chainable {
      clearAuth(): void;
    }
  }
}

Cypress.Commands.add('clearAuth', () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  window.sessionStorage.clear();
});