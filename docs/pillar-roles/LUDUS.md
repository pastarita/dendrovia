# LUDUS: The Rulemaker
**Technical Role:** Gameplay Programmer / Systems Designer / Simulation Engineer
**Primary Mandate:** "Make the Data Playable."

## 1. Domain of Concern
Ludus is the pure logic engine. It is the Dungeon Master. It manages state, rules, probabilities, and progression. It should be capable of running "Headless" (without a GUI).

### Core Responsibilities
*   **The RPG System:** Defining the Classes (Tank/Refactorer, Healer/Hotfixer, DPS/Builder). Managing Stats (HP, Mana/LOC, XP).
*   **The Turn-Based Combat Engine:** Implementing the "Pokemon-style" battle logic. State machine management (WaitingForInput -> PlayerTurn -> EnemyTurn -> Resolution).
*   **Quest Generation:** Taking the history from Chronos and templating it into playable objectives (e.g., "Defeat the Memory Leak in `utils.ts`").
*   **The Gym:** Running automated simulations to balance spell damage against monster HP.

## 2. Technical Stack & Boundaries
*   **State Management:** `xstate` (State Machines) or `zustand` (Store).
*   **Architecture:** Entity Component System (ECS) pattern is recommended for scalability.

### Separation of Concerns
*   **Input:** User Actions (Cast Spell "Refactor") and World Data (from Chronos).
*   **Output:** State Changes (Enemy HP -10, Player XP +50).
*   **RESTRICTION:** Ludus cares nothing for pixels. It deals only in math and state. It should not import `three.js`.

## 3. Shared Governance
*   **With Operatus:** Ludus provides the *State Object* that Operatus must save to the database/local storage.
*   **With Architectus:** Ludus tells Architectus *where* entities are, not what they look like.