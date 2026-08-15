/**
 * KATA Architecture - Layer 3: Example API Component
 *
 * ⚠️  REFERENCE ONLY - THIS COMPONENT USES FICTIONAL ENDPOINTS
 *
 * This file demonstrates the KATA pattern for API components.
 * Endpoints like '/api/example' don't exist - they are placeholders.
 * Use this as a structural guide, not as runnable code.
 *
 * To create your own functional component:
 * 1. Copy this file to tests/components/api/YourApi.ts
 * 2. Replace fictional endpoints with your real API endpoints
 * 3. Update types to match your API's request/response schemas
 * 4. Register in ApiFixture.ts
 * 5. Run: bun run kata:manifest
 *
 * KATA Principles Demonstrated:
 * - ATCs are COMPLETE test cases (mini-flows), NOT single API calls
 * - Each ATC has a UNIQUE expected output (Equivalence Partitioning)
 * - Tuple returns: [APIResponse, TBody, TPayload] for type-safe access
 * - Fixed assertions validate the ATC succeeded
 */

import type { APIResponse } from '@playwright/test';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc } from '@utils/decorators';

// NOTE (2026-08-15): the `@schemas/example.types` imports below were removed —
// that facade is a reference-only template (fictional `/api/example` paths) and
// its type aliases are commented out until `/adapt-framework` replaces them with
// real Bunkai domain facades. This component is itself a reference template.

/** Reference-only shape used by the fictional example responses below. */
interface ExampleResource {
  user?: { id?: string, email?: string }
  token?: string
}

// ============================================
// Example API Component
// ============================================

export class ExampleApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // ATCs - Complete Test Cases
  // ============================================

  /**
   * ATC: POST request with valid payload - expects success (200/201)
   *
   * Complete flow: POST data, validate response structure.
   * Returns the response tuple for test assertions.
   *
   * TODO: Replace 'PROJ' with your Jira project key (e.g., @atc('UPEX-101'))
   * TODO: Update endpoint path
   */
  @atc('PROJ-101')
  async createResourceSuccessfully(
    payload: Record<string, unknown>,
  ): Promise<[APIResponse, ExampleResource, Record<string, unknown>]> {
    // TODO: Update endpoint
    const [response, body, sentPayload] = await this.apiPOST<ExampleResource, Record<string, unknown>>(
      '/api/example',
      payload,
    );

    // Fixed assertions - validates the operation succeeded
    expect(response.status()).toBe(201);
    expect(body.user).toBeDefined();
    expect(body.user?.id).toBeDefined();

    // Optional: Store token for subsequent requests
    if (body.token !== undefined && body.token !== '') {
      this.setAuthToken(body.token);
    }

    return [response, body, sentPayload];
  }

  /**
   * ATC: POST request with invalid payload - expects error (400/401)
   *
   * Validates that invalid data returns appropriate error.
   *
   * TODO: Replace 'PROJ' with your Jira project key (e.g., @atc('UPEX-102'))
   * TODO: Update endpoint path
   */
  @atc('PROJ-102')
  async createResourceWithInvalidData(
    payload: Record<string, unknown>,
  ): Promise<[APIResponse, Record<string, unknown>, Record<string, unknown>]> {
    // TODO: Update endpoint
    const [response, body, sentPayload] = await this.apiPOST<
      Record<string, unknown>,
      Record<string, unknown>
    >('/api/example', payload);

    // Fixed assertions - validates error response
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.ok()).toBe(false);

    return [response, body, sentPayload];
  }

  /**
   * ATC: GET request - expects success (200)
   *
   * Example of a GET ATC for fetching resources.
   *
   * TODO: Replace 'PROJ' with your Jira project key (e.g., @atc('UPEX-103'))
   * TODO: Update endpoint path
   */
  @atc('PROJ-103')
  async getResourceSuccessfully(resourceId: string): Promise<[APIResponse, ExampleResource]> {
    // TODO: Update endpoint
    const [response, body] = await this.apiGET<ExampleResource>(`/api/example/${resourceId}`);

    // Fixed assertions
    expect(response.status()).toBe(200);
    expect(body.user).toBeDefined();

    return [response, body];
  }
}
