// event: uniq and literal string for each event
// name: name of the component that triggers the event
// location: cleaned url without the contract ID

const EVENTS = [
    z.object({
      event: z.literal('page_view'),
      location: z.string(),
    }),
    z.object({
      event: z.literal('event_calendar_add'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('event_attend'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('click_graph_export_excel'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('click_graph_print'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('submit_power_alert_form'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('submit_vacation_form'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('submit_newsletter_form'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('submit_alerts_form'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('submit_query_form'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('submit_contact_form'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('submit_reset_password_form'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('submit_email_password_form'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('submit_register_form'),
      name: z.string(),
      location: z.string(),
    }),
    z.object({
      event: z.literal('click_export_cta'),
      name: z.string(),
      location: z.string(),
    }),
  ]