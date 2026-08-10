# Sofria Rendering Refactor

### Motivation
- ScriptureViewSofria is complex, unwieldy, and awkward to maintain. It also lacks the ability to limit displayed content to specific (verse) ranges of chapter text. It has inline definitions for each Proskomma event action (~1100 lines!), and many interdependencies between event actions on temporary workspace state variables.
- Adding support for verse range limiting would allow SVS to be used to render rich text in footnotes.
- Extracting render actions and utility functions to separate files could greatly ease future maintainance and new feature work.

### Background
- `ScriptureViewSofria.svelte` is the Svelte component responsible for rendering the Scripture text. It uses `SofriaRenderFromProskomma` from `proskomma-json-tools` to render the currently loaded document.
- The `renderDocument` function on `SofriaRenderFromProskomma` generates an event stream representing textual features and data. This event stream is processed by a set of 'action' objects which specify callbacks to be performed when each event is received.
- Proskomma event 'actions' are exclusive by default. That is, they can be selectively enabled via an arrow function `test`, but only the first action for which `test` returns `true` will run for a given event.
- The complexity of the PWA's text rendering means that each event action is usually responsible for handling *part of* the state and rendering for several distinct textual features (e.g. headings, introduction, paragraph blocks, verse numbers, bookmarks, etc.).
- `SofriaRenderFromProskomma` provides a `workspace` object which allows sharing arbitrary state between event actions. In the current configuration, this `workspace`object has over 40 top-level properties, many of which are dynamically set to `null` during the rendering process.
- Event inter-dependencies and shared state mean that it is hard to fully partition, e.g., a basic text paragraph from several related features (verse numbers, etc.).

### Goals
- Implement verse range limiting
- Allow multiple fine-grained actions per event type
- Enable/disable actions based on current settings/properties
- Partition actions into separate files
- Make DOM heirarchy construction more intelligible and avoid use of nullable workspace state

(For testing purposes, the new Scripture view component is implemented as `ScriptureViewProskomma.svelte`.)
### Architecture
- Each event dispatched by `renderDocument` will be processed by a single event handler (`handleSofriaRenderEvent`).
- `handleSofriaRenderEvent` will (1) initialize the render `workspace` with component state and (2) call the appropriate custom action(s) for the respective event. These actions are defined and organized as follows:
	- A "feature file" (`xxxFeature.ts`) in `src/lib/render-sofria` defines a coherent set of "*render* actions" that describe the functionality for (ideally) a single rendering operation. (It's hard to fully separate features due to dependencies between events.)
	- Each feature file defines and exports an instance of `FeatureSpec` that contains a list of 'render actions', a list of render events to which each action should be applied, and a condition flag that determines whether the feature should be enabled for the current document. Render actions have access to the `workspace` and any other contextual data supplied by `SofriaRenderFromProskomma`.
	- When a Scripture is loaded, a Svelte derived state variable is used to process the entire list of features into a dictionary mapping Proskomma event names to render actions for currently enabled features only.
- To avoid complex state for dynamically nesting DOM elements while generating the text HTML, we introduce a `ScopeManager`. A single instance of this class is attached to the `workspace` and performs the following roles:
	- Maintains a stack of active "scopes" within the current render tree. A "scope" corresponds to a logical unit within the document (aligned with the Proskomma event model), and optionally includes a HTML element which represents the (local) root node of this logical unit. A scope can either be a block containing several inner scopes or a standalone leaf node. Examples of possible "scopes" include `paragraph`, `sequence`, `text`, and `document`.
	- Accesses and modifies HTML scope root nodes at any level within the current scope stack.
	- Provides convenient method wrappers for attaching arbitrary HTML content to scopes and "promoting" content from one scope into its parent scope.

## As of 08/10/2026
### Completed work 
- Classes/types/enums for `RenderAction`, `FeatureSpec`, `ScopeManager`, etc.
- Features for generating text phrases/paragraphs and adding verse and chapter numbers
- Feature for keeping track of current verse/chapter position (`TextPositionFeature`)

### Remaining work
- Features for remaining functionality in ScriptureViewSofria: introduction, title, bookmarks, notes, storybook USFM, etc.
- Use `TextPositionFeature` to filter the document by a verse range selector specified in `ScriptureViewSofria`
- Better organize exports among `index.ts`, `common.ts`, and `util.ts`
- Test! (Ideally by diffing output HTML with previous version)
