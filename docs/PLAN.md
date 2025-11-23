# Visual & UX Polish Plan

## Goal
Implement user feedback regarding loading screen aesthetics, entropy pool visuals, and general layout.

## Proposed Changes

### Documentation
#### [MODIFY] [README.md](file:///c:/Offline%20Files/AI%20SDLC/Builds/HyperstitionEngine/README.md)
- Update screenshot link to `Hyperstition_Engine_v0.9.0_Screenshot01.png`.

### Loading Screen
#### [MODIFY] [LoadingScreen.jsx](file:///c:/Offline%20Files/AI%20SDLC/Builds/HyperstitionEngine/src/components/LoadingScreen.jsx)
- **Scrolling Text**: Inject a large array of "mystical" log lines. Implement looping if it runs out.
- **Scramble Animation**: Adjust the scramble speed/interval. Add more "void" characters (blanks, weird unicode).
- **Loading Bar**: Implement a fake progress interpolator that moves smoothly to 90% and then finishes when the actual load is done, to avoid the "instant full" issue.

### Entropy Pool
#### [MODIFY] [EntropyPool.jsx](file:///c:/Offline%20Files/AI%20SDLC/Builds/HyperstitionEngine/src/components/EntropyPool.jsx)
- **Particles**: Increase count to ~5000-7500.
- **Grid**: Re-introduce the grid drawing but make it deform/warp based on mouse position (as requested).

### Layout
#### [MODIFY] [index.css](file:///c:/Offline%20Files/AI%20SDLC/Builds/HyperstitionEngine/src/index.css)
- **Container**: Add a max-width container (e.g., `50vw`) and center it to restrict the app width.

## Future Features (v0.9.2+)

### Advanced Entropy Visuals
#### [MODIFY] [EntropyPool.jsx](file:///c:/Offline%20Files/AI%20SDLC/Builds/HyperstitionEngine/src/components/EntropyPool.jsx)
- **Layered Particles**:
    - Update `Particle` class to include a `z` (depth) property.
    - Map `z` to `size` (smaller = further), `brightness` (dimmer = further), and `speed` (slower = further) to create a parallax effect.
- **Space-Time Grid**:
    - Implement a wireframe mesh (using `p.line` or `p.beginShape(p.LINES)`) instead of points.
    - Apply a spring/elastic force model or a distance-based warp to grid nodes to simulate "space-time" distortion under the mouse cursor.

### Enhanced Oracle Interface
#### [MODIFY] [useEntropyStore.js](file:///c:/Offline%20Files/AI%20SDLC/Builds/HyperstitionEngine/src/store/entropyStore.js)
- Add `sessionHistory` array to state.
- Update `setGeneratedText` to append to `sessionHistory`.

#### [MODIFY] [OracleDisplay.jsx](file:///c:/Offline%20Files/AI%20SDLC/Builds/HyperstitionEngine/src/components/OracleDisplay.jsx)
- **CLI Output**:
    - Replace single text display with a mapping of `sessionHistory`.
    - Style the container to scroll automatically to the bottom (`scrollTop = scrollHeight`).
- **Copy Button**:
    - Add a "COPY LOG" button.
    - Implement `navigator.clipboard.writeText(sessionHistory.join('\n'))`.

## Verification Plan
### Manual Verification
- **Screenshot**: Verify README shows the new image.
- **Loading**: Observe the loading sequence. It should be slower, more interesting, and the bar should move smoothly.
- **Entropy**: Check particle density and grid warping effect.
- **Layout**: Verify the app is centered and takes up half the screen width.
