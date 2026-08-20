import { z } from "zod";

// Keep schema compilation compatible with the strict production CSP.
// Zod otherwise probes dynamic Function support before falling back in Firefox.
z.config({ jitless: true });
