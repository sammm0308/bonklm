# @blackunicorn/bonklm-wizard

> **DEPRECATED**: The wizard has been merged into the main `@blackunicorn/bonklm` package.

## Migration

Use the main package instead:

```bash
# Old (deprecated)
npx @blackunicorn/bonklm-wizard

# New (use this)
npx @blackunicorn/bonklm
```

The CLI functionality is now included in the core package. See the main [README.md](../../README.md) for more information.

---

## Legacy Documentation

This package was an interactive CLI installation wizard for BonkLM. It provided a command-line interface for setting up BonkLM connectors and configuration in your project.

### Legacy Usage

```bash
# Run the interactive setup wizard
bonklm

# Add a specific connector
bonklm connector add openai

# Test a connector
bonklm connector test openai

# Show environment status
bonklm status
```

## License

MIT © Black Unicorn
