import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

/**
 * Order State Machine
 *
 * Defines the valid transitions between order statuses.
 * Any transition not listed here is rejected with a 400.
 *
 * Visual flow:
 *   pending → paid → processing → shipped → delivered
 *       ↓                            ↓
 *  cancelled                  return_requested → refunded
 *
 * Constraints:
 * - Orders cannot move backwards (except via return_requested)
 * - Cancelled orders cannot be reactivated
 * - Refunded orders are terminal
 */

type TransitionMap = Record<OrderStatus, OrderStatus[]>;

const VALID_TRANSITIONS: TransitionMap = {
  pending: ['paid', 'processing', 'cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'return_requested'],
  delivered: ['return_requested'],
  cancelled: [], // Terminal state
  return_requested: ['refunded', 'delivered'], // delivered = return rejected
  refunded: [], // Terminal state
};

/**
 * Asserts that transitioning from `currentStatus` to `nextStatus` is valid.
 * Throws BadRequestException if the transition is illegal.
 */
export function assertValidOrderTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): void {
  const allowedNextStatuses = VALID_TRANSITIONS[currentStatus];
  if (!allowedNextStatuses?.includes(nextStatus)) {
    throw new BadRequestException(
      `Invalid order status transition: ${currentStatus} → ${nextStatus}. ` +
        `Allowed: [${allowedNextStatuses?.join(', ') ?? 'none'}]`,
    );
  }
}

/**
 * Returns all valid next statuses for a given current status.
 * Useful for generating dropdown options in the admin UI.
 */
export function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export { VALID_TRANSITIONS };
