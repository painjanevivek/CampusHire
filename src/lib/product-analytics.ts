export type ProductEventName =
  | "profile_start"
  | "profile_complete"
  | "opportunity_view"
  | "application_start";

export function trackProductEvent(name: ProductEventName) {
  window.dispatchEvent(
    new CustomEvent("campushire:product-event", { detail: { name } }),
  );
}
