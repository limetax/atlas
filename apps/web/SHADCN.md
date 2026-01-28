# UI Component System - shadcn/ui

This project uses [shadcn/ui](https://ui.shadcn.com/docs/installation) for component primitives.

## What is shadcn/ui?

shadcn/ui is **not an npm package** - it's a CLI tool that generates component source code directly into your project. This means:

- ✅ Components live in your codebase (`/src/components/ui/`)
- ✅ You own and can modify the code
- ✅ No black box dependencies
- ✅ Full customization control
- ✅ Tree-shakeable by default

## Why Not in package.json?

You won't see `shadcn` in `package.json` because it's not installed as a dependency. Instead, you'll see the **underlying dependencies** that shadcn components use:

```json
{
  "@radix-ui/react-avatar": "^1.x.x",
  "@radix-ui/react-dropdown-menu": "^2.x.x",
  "@radix-ui/react-slot": "^1.x.x",
  "class-variance-authority": "^0.7.x",
  "clsx": "^2.x.x",
  "tailwind-merge": "^2.x.x"
}
```

## Configuration

See [`components.json`](../apps/web/components.json) for shadcn configuration:

```json
{
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## Brand Customization

Our shadcn components are customized to match [`design.json`](../design.json):

- **Primary buttons**: Orange (#F2B76C)
- **Accent/Focus**: Lime green (#84cc16)
- **Border radius**: 0.75rem-1rem (professional, modern)
- **Shadows**: Subtle depth per design.json specs

## Adding New Components

To add a new shadcn component:

```bash
# From the web app directory
cd apps/web

# Add a component
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog

# View all available components
npx shadcn@latest add
```

This will:

1. Install any required peer dependencies
2. Copy the component source to `src/components/ui/`
3. Apply your theme from `components.json`

## Component Structure (Atomic Design)

Per [`.cursor/rules/frontend-standards.mdc`](../.cursor/rules/frontend-standards.mdc):

```
src/components/
├── ui/          # Shadcn primitives - reusable base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   └── ...
├── features/    # Domain-specific components (compose from ui/)
│   ├── auth/
│   ├── chat/
│   ├── templates/
│   └── compliance/
├── layouts/     # Layout components (Header, Sidebar)
└── pages/       # Route-level page components
```

**Key principle**: Feature components should **compose** from `ui/` primitives, not recreate them.

## Example Usage

```tsx
// ✅ GOOD - Import from ui/
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const MyFeature = () => (
  <Card className="p-6">
    <Button variant="default">Click me</Button>
  </Card>
);

// ❌ BAD - Don't recreate primitives
export const MyFeature = () => (
  <div className="bg-white rounded-xl border p-6">
    <button className="bg-orange-500 px-4 py-2">Click me</button>
  </div>
);
```

## Installed Components

Current shadcn components in the project:

- `button` - Primary UI buttons with variants (default, accent, secondary, ghost, outline)
- `input` - Text input fields with focus states
- `card` - Container component for content
- `badge` - Labels and status indicators
- `avatar` - User profile images with fallbacks
- `dropdown-menu` - Dropdown menus for selections
- `tooltip` - Hover tooltips
- `skeleton` - Loading placeholders

## Documentation & Resources

- **Official Docs**: https://ui.shadcn.com/docs/installation
- **Component Gallery**: https://ui.shadcn.com/docs/components
- **Theming Guide**: https://ui.shadcn.com/docs/theming
- **Tailwind v4 Support**: https://ui.shadcn.com/docs/tailwind-v4

## Troubleshooting

### "Failed to resolve import @/components/ui/..."

This usually means the component hasn't been added yet. Run:

```bash
npx shadcn@latest add [component-name]
```

### Component styling looks wrong

Check:

1. `tailwind.config.ts` - Ensure theme is properly configured
2. `globals.css` - Verify CSS variables match design.json
3. Component file - shadcn components can be freely edited

### Want to customize a component?

Just edit it! The component source is in `src/components/ui/`. It's your code now.

## Migration Notes

This project was migrated from custom UI components to shadcn/ui in January 2026. The migration:

- ✅ Preserved all brand colors from design.json
- ✅ Maintained atomic design structure
- ✅ Replaced custom components with shadcn primitives
- ✅ Built custom AI components (ChatScrollAnchor, ChatStreamingIndicator) using shadcn
- ✅ Improved consistency across the application

---

**Questions?** Check the [shadcn/ui documentation](https://ui.shadcn.com) or ask the team.
