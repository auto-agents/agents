# Get-Time Agent Usage

## Overview

The Get-Time agent is a simple time output agent that periodically writes the current time to a file. It runs continuously at configurable intervals and supports different timezones.

## Configuration

The agent accepts the following configuration parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `interval` | number | 5 | Time interval in seconds between each output |
| `timezone` | string | 'UTC' | Timezone for the output (e.g., 'UTC', 'EST', 'PST') |
| `outputFile` | string | 'output.txt' | Name of the output file |

## Input/Output

**Input:** None (this agent has no input files)

**Output:** 
- File: `run/get-time/[run-id]/output/[outputFile]`
- Format: `YYYY-MM-DD HH:mm:ss`
- Example: `2026-01-31 23:46:25`

## Running the Agent

### Using the Test Runner

```bash
node src/agents/get-time/test-agent.js
```

This will start the agent with default configuration and run for 15 seconds before automatically stopping.

### Custom Configuration

You can modify the configuration by editing `src/agents/get-time/config.json`:

```json
{
    "interval": 10,
    "timezone": "EST",
    "outputFile": "time-output.txt"
}
```

## Supported Timezones

The agent supports the following timezone abbreviations:
- UTC (Coordinated Universal Time)
- EST (Eastern Standard Time, UTC-5)
- EDT (Eastern Daylight Time, UTC-4)
- CST (Central Standard Time, UTC-6)
- CDT (Central Daylight Time, UTC-5)
- MST (Mountain Standard Time, UTC-7)
- MDT (Mountain Daylight Time, UTC-6)
- PST (Pacific Standard Time, UTC-8)
- PDT (Pacific Daylight Time, UTC-7)

## Agent Lifecycle

The agent supports the following commands:

- **start**: Begins time output at configured intervals
- **stop**: Gracefully stops the agent and cleans up resources
- **pause**: Temporarily stops time output (keeps process running)
- **resume**: Resumes time output after pause
- **exit**: Terminates the agent process

## File Structure

When the agent runs, it creates the following directory structure:

```
run/get-time/[run-id]/
├── config.json              # Run configuration
├── performance-measures.json # Execution metrics
├── run.log                   # Agent activity logs
├── state.json                # Agent state information
└── output/
    └── [outputFile]          # Time output file
```

## Example Output

With default configuration, the agent will output lines like:

```
2026-01-31 23:46:14
2026-01-31 23:46:19
2026-01-31 23:46:25
```

## Error Handling

The agent logs all activities and errors to the run log file. Common issues include:
- Invalid timezone values (falls back to UTC)
- File permission errors (logged as errors)
- Configuration file not found (uses defaults)

## Performance

The agent is lightweight and designed for continuous operation. Performance metrics are automatically tracked and saved to `performance-measures.json` including:
- Start and end times
- Total execution duration
- Final agent state
