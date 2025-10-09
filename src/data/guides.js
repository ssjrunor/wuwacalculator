export const guides = [
    {
        category: 'Rotations',
        guides: [
            {
                title: 'Using the Rotations Section',
                type: 'article',
                shortDesc: 'Learn how to record, organize, and optimize skill rotations in the calculator.',
                content: `
                <p>The <strong>Rotations Section</strong> lets you create and manage skill sequences for your character, whether you want to test a short combo or simulate full team damage rotations. Every entry you add contributes to a running total, which updates live as you experiment.</p>

                <h4>1. Adding Skills</h4>
                <p>Click <strong>+ Skill</strong> to open a categorized menu showing all your character’s attacks, skills, and effects. Each group (Normal Attack, Resonance Skill, Liberation, etc.) can be expanded or collapsed. Selecting a skill adds it to your current rotation list with its name, icon, and damage preview.</p>
                <p>You can also <strong>edit existing entries</strong> by clicking the pencil icon next to them — this reopens the skill menu so you can swap that entry for another ability while keeping its multiplier.</p>

                <h4>2. Reordering Skills</h4>
                <p>Click and drag skills in the list to change their order. The order doesn't impact the skill entry or rotation totals.</p>

                <h4>3. Multipliers</h4>
                <p>Each skill has a small numeric field labeled <strong>×</strong>. This acts as a multiplier — for example, entering 3 simulates using that skill three times in a row. The total rotation damage reflects all multipliers instantly.</p>

                <h4>4. Locking Skills</h4>
                <p>Click any skill entry to toggle its <strong>locked</strong> state. When locked, the skill snapshot is frozen: its damage will no longer update when buffs, weapon stats, or character levels change. This is useful for snapshot mechanics or comparing damage before and after specific buffs. Locked items show a highlighted border for clarity.</p>

                <h4>5. Clearing and Editing</h4>
                <p>Use the <span style="color: red; font-weight: bold;">Clear</span> button to remove all entries and start fresh. Each individual entry also includes delete and edit buttons for precise management.</p>
                
                <h4>6. Team Rotations</h4>
                <p>The <strong>Team Rotation</strong> system lets you combine multiple characters’ saved rotations into one synchronized total. This feature appears in the <strong>Team Buffs</strong> section once your active character has at least one teammate added to the team and those teammates have their own recorded or saved rotations.</p>
                
                <p>Each teammate will appear inside an expandable <strong>Rotations</strong> section, showing a dropdown selector and a summary of their damage totals — <strong>Normal</strong>, <strong>Crit</strong>, and <strong>Average</strong>.</p>
                
                <p>From the dropdown, you can pick which version of that teammate’s rotation to include:
                <ul>
                <li><strong>Live</strong> — their current on-screen rotation and character setup.</li>
                <li><strong>Saved</strong> — one of their previously stored rotations.</li>
                </ul>
                When you select a rotation, it’s immediately linked to your active character’s team rotation data.</p>
                
                <p>Next to each teammate entry, you’ll find an <strong>Enable</strong> checkbox. This determines whether that teammate’s rotation is currently contributing to the total team damage output. You can toggle it on or off to compare performance with and without specific teammates.</p>
                
                <p>The selected teammate rotation values update live, displaying their total <strong>Normal</strong>, <strong>Crit</strong>, and <strong>Average</strong> damage in the panel. Once all active teammates are configured and enabled, the calculator combines their totals with your own in the <strong>Team Rotation Summary</strong> located beneath the Damage section. Each character’s contribution percentage is displayed clearly to show who carried the fight.</p>
                
                <p>When you <strong>save a Team Rotation</strong>, the system stores just your main character's state and the linked teammate rotations.</p>
                
                <h4>7. Saving and Loading Rotations</h4>
                <p>When you’re satisfied with a sequence, click the large <strong>＋</strong> button to save it. For team rotations, you'll find this save button in the <strong>Team</strong> tab, to save a team rotation you'll need to have at least <span style="font-weight: bold" >ONE</span> teammate's rotation enabled.</p>
                <p>Saved rotations are stored globally and can be accessed later from the <strong>Saved</strong> tab. You can rename them inline, sort by date, total damage, or name, and delete old ones anytime.</p>
                
                <p>You can also <strong>export</strong> or <strong>import</strong> rotations as <code>.json</code> files, making it easy to share builds with other players. Importing a file from a different character <span style="font-weight: bold">WILL NOT WORK</span>. Mismatched data from being applied so rotations always stay consistent with their intended character.</p>
                <p>Keep in mind that loading a saved personal or team rotation will <code style="color: red; font-weight: bold;">OVERWRITE</code> your current character’s state with the saved one.</p>

                <h4>8. Sorting and Filtering Saved Rotations</h4>
                <p>In the <strong>Saved</strong>/<strong>Team</strong> tab, you can:</p>
                <ul>
                    <li>Sort by <em>Date</em>, <em>Name</em>, or <em>Total Damage</em>.</li>
                    <li>Switch between ascending and descending order.</li>
                    <li>Filter to view only rotations for a specific character.</li>
                </ul>
                <p>Each saved entry shows Normal, Crit, and Average damage values, along with the date it was created. You can also export <span style="font-weight: bold">rotation files</span> or load the saved character's <span style="font-weight: bold"> full character state</span> from here directly.</p>

                <h4>9. Total Damage Summaries</h4>
                <p>At the bottom of the Damage section, a <strong>Rotation Summary</strong> shows the total Normal, Crit, and Average values for your sequence. It also breaks down damage contribution by type (e.g., Basic, Skill, Liberation). If any healing or shielding abilities were used, these appear in separate totals in <span style="color: limegreen; font-weight: bold;">green</span> and <span style="color: #838383; font-weight: bold;">gray</span> respectively.</p>
                <p>When a valid team rotation is active, you’ll see a <strong>Team Damage Summary</strong> below, showing each character’s percentage contribution to the total output.</p>

                <h4>10. Advanced Tips</h4>
                <ul>
                    <li><strong>Snapshot Behavior:</strong> Locking skills allows testing “snapshot” buffs — like when a skill’s damage is fixed at activation even if later buffs expire.</li>
                    <li><strong>Skill Visibility:</strong> Hidden or disabled skills (like passive or auto-applied damage types) won’t appear in the menu or totals to prevent clutter.</li>
                    <li><strong>Subhits:</strong> If you enable <em>“Show Sub-Hits”</em> in the Damage Section, individual hit components appear with tooltips, helping analyze multi-hit or DOT effects.</li>
                </ul>

                <p>The Rotations system is designed to feel like a training ground — flexible, responsive, and easy to adjust. Combine it with the Buffs and Echo panes to model real gameplay scenarios and fine-tune your builds with precision.</p>
            `
            }
        ]
    },
    {
        category: 'Echoes',
        guides: [
            {
                title: 'Using the Echoes Pane',
                type: 'article',
                shortDesc: 'Learn how to equip, edit, and manage Echoes in your character setup.',
                content: `
                <p>The <strong>Echoes Pane</strong> lets you equip up to five Echoes per character, view their stats, and manage your builds efficiently. It’s designed to mirror the in-game experience while giving you full customization and control.</p>

                <h4>1. Equipping Echoes</h4>
                <p>Each of the five Echo slots can hold one Echo. Click an empty slot or an existing Echo to open the <strong>Echo Menu</strong>, where you can browse available Echoes. Echoes are grouped by their <strong>cost tiers (1, 3, or 4)</strong>, and the total cost must stay under 12.</p>
                <p>To clear everything, click the <strong>Unequip All</strong> button next to Import Echo.</p>

                <h4>2. Echo Information</h4>
                <p>Each Echo displays its <strong>name, icon, cost, main stats,</strong> and <strong>set affiliation</strong>. Hover over an Echo to see its detailed description and any set bonuses it contributes toward.</p>

                <h4>3. Editing Stats</h4>
                <p>Click on an equipped echo stats space to open it's <strong>Edit Substats Modal</strong>. Here you can:
                <ul>
                    <li>View or change its main stats (like HP%, ATK%, or Attribute Bonus).</li>
                    <li>Edit up to five substats directly using dropdowns and value inputs.</li>
                    <li>Add new substats using the <strong>+</strong> button, initialized with default values.</li>
                    <li>Switch between available <strong>sonata set options</strong> using the icon toggle icons.</li>
                    Changes made her will need to be saved by clicking on the save button.
                </ul>
                Changes are applied instantly and reflected in your total Echo stats summary.</p>

                <h4>4. Echo Bag</h4>
                <p>Your <strong>Echo Bag</strong> acts as a shared collection across all characters. You can store Echoes you’ve created or parsed from screenshots (see below), and later equip them onto any character. The bag opens as a scrollable menu where you can manage saved Echoes, edit them, or transfer them into active slots.</p>

                <h4>5. Parsing Echoes from Screenshots</h4>
                <p>The built-in <strong>Echo Parser</strong> uses OCR (Optical Character Recognition) to extract Echo data directly from screenshots. Upload an image or drag it into the parser area, and it will automatically detect the Echo’s:
                <ul>
                    <li>Name and cost</li>
                    <li>Main and substats</li>
                    <li>Associated set</li>
                </ul>
                See more under the <strong>Echo Importing</strong> guide category.</p>

                <h4>6. Managing Sets and Bonuses</h4>
                <p>Echoes belonging to the same sonata set automatically grant <strong>2-piece</strong>, <strong>3-piece</strong> or <strong>5-piece bonuses</strong>, depending on how many are equipped. The system displays these bonuses in real time under your character’s stats and contributes to the final damage calculations.</p>

                <h4>7. The Main Echo Slot</h4>
                <p>One slot is designated as your <strong>Main Echo</strong>. Echoes placed here grant an additional active effect or buff. Some of these buffs are <strong>toggleable</strong> or <strong>stackable</strong> — if available, you’ll see small checkboxes or dropdowns beside the description to control them.</p>

                <h4>8. Did you know?</h4>
                <p>Hovering over individual substats let you see their roll values as percentages.</p>

                <h4>9. Derived Metrics</h4>
                <p>The Overview includes advanced metrics like <strong>Crit Value (CV)</strong> and <strong>Build Score</strong>, which evaluate how optimized your build is. These are derived automatically:</p>
                <ul>
                    <li><strong>Crit Value (CV):</strong> A combined score from Crit Rate and Crit DMG — used to measure offensive balance.</li>
                    <li><strong>Build Score:</strong> A normalized build quality metric based on Echo substat efficiency and scoring. (See more under the <strong>Scoring</strong> guide category.</li>
                </ul>
                 `
            }
        ]
    },
    {
        category: 'Team Buffs',
        guides: [
            {
                title: 'Using the Team Buffs Section',
                type: 'article',
                shortDesc: 'Learn how to manage Echo, Weapon, and Team buffs and how teammate rotations contribute to total damage.',
                content: `
                <p>The <strong>Team Buffs</strong> section brings together all external effects from teammates that influence your character’s stats, from <strong>Echo/Sonata Set</strong> effects to <strong>Weapon</strong> passives and <strong>Teammate</strong> synergy effects. It acts as the central hub for managing and viewing every modifier that affects your character’s performance within a team.</p>

                <h4>1. Overview</h4>
                <p>This section automatically compiles three major buff sources:</p>
                <ul>
                    <li><strong>Weapon Buffs</strong> – effects from teammates' weapons.</li>
                    <li><strong>Echo Buffs</strong> – effects from teammates' echoes and sonata sets.</li>
                    <li><strong>Teammate Buffs</strong> – conditional effects provided by your selected teammates, such as shared ATK boosts or healing amplifications.</li>
                </ul>

                <h4>2. Weapon Buffs</h4>
                <p>All weapons with supportive effects are listed automatically under <strong>Weapon Buffs</strong>.</p>
                <ul>
                    <li>Use the <strong>Rank</strong> dropdown beside a weapon to select its refinement (0–5).</li>
                    <li>The passive becomes active only when its rank is above 0, and its value scales accordingly.</li>
                    <li>Changes are reflected instantly in the active character’s stats and damage output.</li>
                </ul>

                <h4>3. Echo Buffs</h4>
                <p>All <strong>Echo</strong> and <strong>Sonata Set</strong> bonuses with supportive effects appear here automatically.</p>
                <ul>
                    <li>Toggle switches activate effects like DMG bonuses, healing boosts, or RES shredding.</li>
                    <li>Stackable effects display a dropdown to set the current number of stacks.</li>
                    <li>Adjustments update your final stats and calculations in real time.</li>
                </ul>

                <h4>4. Teammate Buffs</h4>
                <p>When you select <strong>teammates</strong> for your active character, their passive or support effects are also represented here.</p>
                <ul>
                    <li>For example, a support who provides teamwide ATK% or Elemental DMG bonuses will have their effects listed automatically.</li>
                    <li>Some effects may not require you to do anything and are automatically merged into your stats behind the scenes, so no toggle is needed.</li>
                    <li>Others may include toggles or dropdowns to represent active or stack-based buffs, allowing fine control over synergy effects.</li>
                </ul>

                <h4>5. Teammate Rotations</h4>
                <p>Beneath the above, you’ll find the <strong>Rotations</strong> section whenever valid team rotations exist. This links your teammates’ saved or active rotations directly into the team’s total calculation.</p>
                <ul>
                    <li>Each teammate appears with their name, a rotation dropdown, and their total <strong>Normal</strong>, <strong>Crit</strong>, and <strong>Average</strong> damage values.</li>
                    <li>You can switch between different saved rotations for that teammate, or disable them entirely using the <strong>Enable</strong> checkbox.</li>
                    <li>Enabled teammate rotations contribute their totals to your <strong>Team Damage Summary</strong> at the bottom of the Damage Section, giving you a live snapshot of overall team output and percentage contribution per character.</li>
                    <p>See more under the Rotations guide category.</p>
                </ul>

                <p>Use the <strong>Team Buffs</strong> section to fine-tune every cooperative variable affecting your team’s performance. Whether you’re activating weapon passives, enabling Echo Set bonuses, or syncing teammate rotations, this pane provides a unified overview of how each member’s effects combine to shape total output.</p>
            `
            }
        ]
    },


    {
        category: 'Custom Buffs',
        guides: [
            {
                title: 'Using Custom Buffs',
                type: 'article',
                shortDesc: 'Add and adjust personal buffs for testing stat variations and conditional bonuses.',
                content: `
                <p>The <strong>Custom Buffs Pane</strong> lets you manually add or adjust stat bonuses that aren’t tied to characters, teammates, weapons, or echoes. It’s perfect for testing how specific buffs affect your final damage output.</p>

                <h4>1. Main Stats</h4>
                <p>At the top, you’ll see inputs for <strong>Attack</strong>, <strong>HP</strong>, and <strong>Defense</strong> — each with a flat and percentage field. 
                You can also modify core attributes like <strong>Crit Rate</strong>, <strong>Crit Damage</strong>, <strong>Energy Regen</strong>, and <strong>Healing Bonus</strong>.
                These directly influence your base stats and are reflected instantly in your character summary.</p>

                <h4>2. Damage Modifiers</h4>
                <p>Below, you’ll find a large grid of fields controlling how different attack types and elements are boosted. 
                These include <strong>Basic, Heavy, Resonance Skill, and Resonance Liberation</strong> damage, as well as attribute bonuses such as <span style="color: rgb(15,205,160); font-weight: bold;">Aero</span>, <span style="color: rgb(62,189,227); font-weight: bold;">Glacio</span>, and <span style="color: rgb(197,52,79); font-weight: bold;">Fusion</span>. 
                Each stat can be entered as a percentage value to represent bonus damage.</p>

                <h4>3. Amplify and Shred Effects</h4>
                <p>Amplify modifiers boost damage scaling rather than adding flat bonuses. 
                They apply to specific attack types or attributes (e.g., “Basic Attack DMG Amplify” or “Spectro DMG Amplify”). 
                You can also simulate defensive effects with fields like <strong>Enemy DEF Shred</strong>, <strong>Enemy DEF Ignore</strong>, or <strong>Enemy RES Shred</strong> to test how they impact your damage output.</p>

                <h4>4. Coordinated and Special Damage</h4>
                <p>Coordinated and special damage types, such as <span style="color: rgb(202,179,63); font-weight: bold;">Frazzle</span> or <span style="color: rgb(15,205,160); font-weight: bold;">Erosion</span>, have their own dedicated fields. 
                These affect abilities that trigger off allied attacks or secondary damage sources.</p>

                <h4>5. Adjusting Values</h4>
                <p>Simply type numbers into the fields to modify stats. 
                Percent-based fields automatically include a “%” symbol, while flat stats are raw numeric values. 
                All changes apply instantly to your calculations — no need to press Save.</p>

                <h4>6. Clearing Buffs</h4>
                <p>If you want to reset everything, click the <span style="color: red; font-weight: bold;">Clear All</span> button at the bottom. 
                This restores all fields to zero and removes every manually added buff.</p>

                <p>The Custom Buffs pane is ideal for experimentation. 
                Whether you’re modeling food buffs, temporary effects, or new theories about damage scaling, 
                this section gives you total control over the numbers before they merge into your final stat pool.</p>
            `
            }
        ]
    },
    {
        category: 'UI Controls',
        guides: [
            {
                title: 'Toggles, Stacks, and Input Fields Explained',
                type: 'article',
                shortDesc: 'Learn how to use character toggles, stack counters, and input fields — and when they’re locked, conditional, or not required.',
                content: `
                <p>Each character’s section in the calculator includes interactive elements that simulate in-game conditions. These controls let you manually enable buffs, adjust stack counts, or input numeric values to reflect your combat setup more accurately. Understanding how they behave ensures your results match in-game performance.</p>

                <h4>1. Toggles (On/Off Buffs)</h4>
                <p>Toggles are checkboxes used to enable or disable specific states or abilities. When checked, the corresponding buff becomes active and its effects are immediately reflected in your calculations.</p>

                <p>For example, <strong>Zani</strong>’s <span class="highlight">Inferno Mode</span> toggle activates a state where her Basic Attack damage is increased. You can switch it on when testing burst phases or off when simulating downtime.</p>

                <p>Some toggles are <strong>conditional</strong>. <strong>Lupa</strong>’s <span class="highlight">Pack Hunt (2)</span> toggle only activates when your team has exactly three <span style="color: rgb(197,52,79); font-weight: bold;">Fusion</span> Resonators. If that condition isn’t met, the toggle is dimmed and displays a message like <em>“Needs 3  <span style="color: rgb(197,52,79); font-weight: bold;">Fusion</span> Resonators in the team.”</em> This prevents impossible setups from being activated.</p>

                <p>Other toggles, such as <span class="highlight">Outro Skill</span> buffs like <strong>Binary Butterfly</strong> or <strong>Beacon for the Future</strong>, can be freely toggled at any time, since they represent effects that can occur during normal play.</p>

                <h4>2. Stacks (Layered Buff Counters)</h4>
                <p>Stack counters simulate effects that build up over time or through repeated actions. These appear as dropdowns or numeric selectors labeled <strong>Stacks</strong>.</p>

                <p>For instance, <strong>Lupa</strong>’s <span class="highlight">Hunting Field</span> can stack up to 2 times, granting a  <span style="color: rgb(197,52,79); font-weight: bold;">Fusion DMG Bonus</span> for each stack. You can use the dropdown to select 0, 1, or 2 stacks, and the total buff scales accordingly.</p>

                <p>Similarly, Zani’s <span class="highlight">Heliacal Ember</span> uses a numeric input where you can enter the current number of embers (from 0–60). Each stack increases damage dealt by a fixed percentage, making it easy to test full-power states versus minimal ones.</p>

                <p>When a stack-based ability isn’t relevant to a character or build, its field simply won’t appear.</p>

                <h4>3. Input Fields (Dynamic Values)</h4>
                <p>Numeric input fields let you fine-tune continuous values such as percentages, thresholds, or resource levels. For example, <strong>Energy Regen</strong> sliders and <strong>Blaze Consumed</strong> inputs directly modify the calculations they’re tied to.</p>

                <p>In <strong>Zani</strong>’s case, her <span class="highlight">Blaze Consumed</span> input allows values up to 40 (or more for sequence variants). Each number represents how many Blazes are used in her Heavy Attack, directly scaling her damage. These inputs are clamped to valid ranges, so entering an invalid value automatically snaps back to the nearest limit.</p>

                <p>Inputs also respect dependencies — for example, some sliders or dropdowns may be disabled if a prerequisite state isn’t active or unlocked by sequence level.</p>

                <h4>4. Level and Sequence Restrictions</h4>
                <p>Some toggles or stack fields are locked until the Resonator reaches a specific level or sequence tier. These are shown with faded color and a tooltip such as <em>“Unlocks at Lv. 70”</em> or <em>“Requires Sequence 3”</em>. When you raise your character level or sequence value in the app, the controls automatically become usable.</p>

                <h4>5. When Controls Aren’t Needed</h4>
                <p>If a skill or state is always active by default — for example, a passive buff that doesn’t depend on toggles or stacks — no interactive field is shown. The calculator hides unnecessary inputs to reduce clutter and make the layout intuitive.</p>

                <h4>6. How They Work Together</h4>
                <p>Many of these elements interact dynamically. Activating <span class="highlight">Inferno Mode</span> for Zani can affect how her <span class="highlight">Blaze Consumed</span> input contributes to damage. Similarly, enabling <span class="highlight">Pack Hunt</span> for Lupa modifies how her <span class="highlight">Hunting Field</span> stacks scale team-wide bonuses. These interactions ensure your setup behaves like an in-game combat sequence rather than isolated numbers.</p>

                <p>Every toggle, stack, and input updates the calculator in real time — so you can test how buffs combine, explore edge cases, and see exactly how different configurations change your team’s performance.</p>
            `
            }
        ]
    },
    {
        category: 'Echo Importing',
        guides: [
            {
                title: 'Using the Echo Parser',
                type: 'article',
                shortDesc: 'Quickly import your equipped Echoes directly from screenshots using OCR and image recognition.',
                content: `
                <p>The <strong>Echo Parser</strong> lets you import your full set of equipped Echoes automatically from a screenshot — no manual stat entry required. It uses OCR (optical character recognition) and image comparison to read the details directly from an image generated by the <strong>Wuthering Waves bot</strong>.</p>

                <h4>1. What It Does</h4>
                <p>This feature scans an image of your Echo setup, detects each Echo’s cost, main stat, substats, and set name, and then automatically equips them for the currently selected character. It’s a fast, hands-free way to sync your in-game build with the calculator.</p>

                <h4>2. Getting a Valid Image</h4>
                <p>For the parser to work properly, your image must match the expected format:</p>
                <ul>
                    <li>Use the <code>/create</code> command with the <strong>Wuwa bot</strong> on the official Wuthering Waves Discord server (or anywhere else the bot is available).</li>
                    <li>Make sure the image resolution is exactly <strong>1920 × 1080</strong>.</li>
                    <li>Do not crop, resize, or compress the screenshot — even slightly altering dimensions can break detection.</li>
                    <li>The parser currently supports <strong>English text only</strong>.</li>
                    <li>The import is not always 100% accurate — check results after import and make manual corrections if needed.</li>
                </ul>

                <h4>3. Starting the Import</h4>
                <p>Click the <strong>Import Echo</strong> button in the Echoes section (top left). This opens a pop-up with import rules and a sample image preview.</p>
                <ul>
                    <li>You can drag and drop your image into the import window, paste it from your clipboard, or click <strong>Choose Image</strong> to upload it manually.</li>
                    <li>The app automatically validates the resolution before continuing.</li>
                    <li>If the image is invalid (wrong size or format), a red error toast appears.</li>
                </ul>

                <h4>4. Parsing Process</h4>
                <p>Once a valid image is uploaded, the system runs the following steps automatically:</p>
                <ul>
                    <li>Preloads reference icons for all known Echoes and set logos to improve recognition accuracy.</li>
                    <li>Uses OCR (via <strong>Tesseract.js</strong>) to detect text for main stats and substats.</li>
                    <li>Extracts five echo regions across the bottom of the image, matching the exact coordinates used by the Wuwa bot layout.</li>
                    <li>Compares each icon region pixel-by-pixel with stored reference images to determine the Echo’s name and set.</li>
                    <li>Applies all parsed Echo data instantly to your current character — including main stats, substats, cost, and set.</li>
                </ul>
                <p>During parsing, a spinner will appear with a loading animation. Once finished, you’ll see a success message</p>

                <h4>5. Accuracy Notes</h4>
                <p>The parser is trained for images in the default bot format and English text. It works best when:</p>
                <ul>
                    <li>Text is clear and uncompressed.</li>
                    <li>Stats don’t overlap or blur into backgrounds.</li>
                    <li>The image hasn’t been modified or taken through screenshots of screenshots (which causes compression artifacts).</li>
                </ul>
                <p>If an imported Echo looks off, you can open it in the <strong>Edit Substats</strong> modal to adjust values or fix stat labels manually.</p>

                <h4>6. Managing Imports</h4>
                <p>After a successful import:</p>
                <ul>
                    <li>Your five Echo slots update instantly with the new data.</li>
                    <li>Each imported Echo automatically gets its proper set icon and name.</li>
                    <li>You can still edit, remove, or replace individual Echoes afterward.</li>
                </ul>

                <h4>7. Behind the Scenes</h4>
                <p>Here’s a simplified overview of what happens technically:</p>
                <ul>
                    <li>Each Echo slot’s region in the screenshot is mapped to pre-defined coordinates.</li>
                    <li>Each slot’s cost, main stat, and substats are extracted as text using OCR.</li>
                    <li>Icon matching runs via pixel comparison between the slot’s image region and a preloaded cache of reference icons.</li>
                    <li>The results are passed to a converter that builds real Echo objects and applies them to your current character state.</li>
                </ul>
                <p>This all happens locally in your browser — no external uploads or server-side processing.</p>

                <h4>8. Troubleshooting</h4>
                <ul>
                    <li>If nothing happens after upload, check that the image is exactly 1920×1080.</li>
                    <li>If some stats look wrong, open each Echo’s edit window and correct them manually.</li>
                    <li>Images in other languages or formats (like cropped in-game screenshots) aren’t supported yet.</li>
                    <li>For repeated errors, try refreshing and importing again — browser caching sometimes interferes with reference images.</li>
                </ul>

                <h4>9. Performance Tips</h4>
                <ul>
                    <li>First import may take a few extra seconds while reference images load; subsequent imports will be much faster.</li>
                    <li>Paste directly from your clipboard (Ctrl+V / Cmd+V) instead of saving locally — it’s faster and skips file browsing.</li>
                </ul>

                <h4>10. Disclaimer on Image Format Changes</h4>
                <p><span style="font-weight: bold; color: red">Important:</span> The parser depends entirely on the current format of images generated by the <strong>official Wuthering Waves Discord bot</strong> (or other supported generators). If <strong>Kuro Games</strong> or the maintainers of the bot ever change the image layout, text alignment, or resolution, the parser will no longer recognize data correctly until it’s updated. In such cases, results will be unreliable until the parsing coordinates and recognition templates are adjusted.</p>
            `
            }
        ]
    },
    {
        category: 'App Controls',
        guides: [
            {
                title: 'App Actions & Activities',
                type: 'article',
                shortDesc: 'Understand what happens when you save, reset, sync, or interact with features throughout the calculator.',
                content: `
                <p>The calculator isn’t just a static tool — it’s a living workspace that reacts instantly to what you do. Every button, switch, and action triggers updates across the app in real time. Here’s a complete overview of what each major action does and how it fits into your workflow.</p>

                <h4>1. Saving & Persistence</h4>
                <p>Almost everything you do in the app — selecting characters, changing buffs, editing Echoes, setting up rotations — is saved automatically. This is handled through local storage, so your configuration stays exactly how you left it, even after refreshing or closing the browser.</p>
                <ul>
                    <li><strong>Auto-Save:</strong> Each pane saves its state (Echoes, Rotations, Buffs, Theme, etc.) individually, so updates in one area don’t reset another.</li>
                    <li><strong>Session Continuity:</strong> When you reopen the app, your last selected character, layout, and visual theme are restored automatically.</li>
                    <li><strong>Persistent Settings:</strong> Preferences like system theme mode, animation toggles, or Drive Sync authentication are remembered until explicitly cleared.</li>
                </ul>

                <h4>2. App Reset</h4>
                <p>The <strong>Delete</strong> button, found on the Settings page, completely restores the calculator to its default state — as if you were opening it for the very first time. It deletes <strong>everything</strong> stored locally, including saved rotations, equipped Echoes, team compositions, buffs, and all user preferences.</p>
                
                <ul>
                    <li><strong>Full Data Wipe:</strong> All localStorage data and runtime states are cleared instantly, including saved rotations, team rotations, Echo setups, and character progress.</li>
                    <li><strong>Preference Reset:</strong> Dark/light theme overrides, dropdown selections, and pane-specific toggles are restored to default values.</li>
                    <li><strong>UI Memory:</strong> Clears cached states like last-opened panels, tooltips, and toast history.</li>
                    <li><strong>Global State:</strong> All character- and weapon-specific configurations are deleted, including any custom buffs or conditions you created.</li>
                </ul>
                
                <p>After confirmation, the app performs a full reload to rebuild a clean environment.  
                Your <strong>Google Drive–linked data</strong> (if Drive Sync is enabled) is not deleted automatically — it stays safe on your cloud storage until you manually remove or overwrite it from there.  
                Everything else stored locally will be permanently lost.</p>
                
                <p>Use this action only when you want to start completely fresh or troubleshoot corrupted data. The reset is immediate, irreversible, and cannot be undone once confirmed.</p>

                <h4>3. Theme & System Behavior</h4>
                <p>The calculator’s visual theme adapts dynamically:</p>
                <ul>
                    <li><strong>System Mode:</strong> It follows your device’s current theme (light or dark) automatically.</li>
                    <li><strong>Manual Toggle:</strong> You can override it with the switch in Settings. The toggle mimics system behavior and updates instantly if your OS theme changes.</li>
                    <li><strong>Visual Consistency:</strong> All panes (Echoes, Rotations, Buffs) share the same theme context, so transitions are smooth and unified.</li>
                </ul>

                <h4>4. Exporting & Syncing</h4>
                <p>The app supports exporting and syncing data, especially for advanced users who use multiple devices or want backups:</p>
                <ul>
                    <li><strong>Google Drive Sync:</strong> When enabled, your app state and configurations (Echoes, Rotations, etc.) sync securely to your Google Drive in the hidden “AppData” folder.</li>
                    <li><strong>Auto-Restore:</strong> When you log in again, the app checks for Drive data and restores it automatically.</li>
                    <li><strong>Export / Import:</strong> You can export rotations or entire setups as <code>.json</code> files and import them later, or share with other users.</li>
                </ul>

                <h4>5. Interactive Activities</h4>
                <p>Most parts of the app respond interactively — meaning they update immediately without reloading:</p>
                <ul>
                    <li><strong>Dragging & Dropping:</strong> You can reorder rotation entries, Echoes, or blocks using intuitive drag-and-drop behavior. All changes recalculate live.</li>
                    <li><strong>Popup Messages:</strong> Small toasts appear to confirm actions (e.g., saving to bag, invalid import, success messages). These fade automatically but can be interacted with while visible.</li>
                    <li><strong>Expandable Sections:</strong> Each pane uses collapsible sections (like Buffs, Totals, and Rotations) so you can keep your workspace tidy while focusing on specific areas.</li>
                    <li><strong>Dynamic Tooltips:</strong> Hovering over stats or icons reveals detailed tooltips showing what each number represents, including calculated roll values or set bonuses.</li>
                </ul>

                <h4>6. Data Integrity & Overwrites</h4>
                <p>To prevent confusion, the app uses explicit overwrite logic when importing or loading:</p>
                <ul>
                    <li><strong>Rotation Imports:</strong> If a rotation file belongs to another character, you’ll get a warning and the app will block the overwrite to protect your current state.</li>
                    <li><strong>Team Rotations:</strong> Loading a full team rotation replaces each teammate’s state exactly as it was saved — a warning label appears in red to emphasize this behavior.</li>
                    <li><strong>Reset Confirmation:</strong> The Reset Settings button can’t be triggered accidentally — it always asks for confirmation before clearing your stored data.</li>
                </ul>

                <h4>8. Safety & Recovery</h4>
                <p>If anything goes wrong — from a failed import to a parsing error — the app isolates that event instead of crashing the whole session. Toasts will explain what happened, and your last stable state remains untouched. For critical resets, a confirmation or reload ensures you never lose progress unintentionally.</p>
            `
            }
        ]
    },
    {
        category: 'Overview',
        guides: [
            {
                title: 'Using the Overview Section',
                type: 'article',
                shortDesc: 'Get a full, interactive summary of your character’s build.',
                content: `
                <p>The <strong>Overview Section</strong> gives you a complete visual snapshot of your character’s build, combining both style and substance. It merges the <strong>Character Overview</strong> and <strong>Overview Detail Pane</strong> into a single, interactive display where you can view, verify, and showcase your entire setup at a glance.</p>

                <h4>1. Overview Layout</h4>
                <p>The Overview is divided into two complementary panels:</p>
                <ul>
                    <li><strong>Left Panel:</strong> Shows a list of all characters you're ever used.</li>
                    <li><strong>Right Panel:</strong> Displays your character’s splash art, name, level, weapon, Echoes, teammates... all that stuff — all dynamically linked to your current configuration.</li>
                </ul>

                <h4>2. Equipped Weapon</h4>
                <p>Beneath the character info, the equipped weapon is shown with its icon, name, and rank. Hovering reveals its passive description and scaling. Any change you make in the <strong>Weapon Pane</strong> like changing its level or refinement immediately updates here.</p>

                <h4>3. Rotation Summary</h4>
                <p>The Overview includes two compact <strong>Rotation Boxes</strong> that summarize damage from your personal and team rotations. They let you review totals, skill-by-skill breakdowns, and teammate contributions without leaving the Overview page.</p>
                <ul>
                  <li><strong>Dropdown:</strong> Each box includes a dropdown that lets you choose which rotation to view — either your <em>live rotation</em> (“Rotation DMG” or “Team Rotation DMG”) or any <em>saved rotation</em> by name.</li>
                  <li><strong>Displayed values:</strong> Both boxes show three key numbers:
                    <ul>
                      <li><strong>Normal</strong> – non-critical damage total,</li>
                      <li><strong>CRIT</strong> – critical hit total,</li>
                      <li><strong>AVG</strong> – average combined damage.</li>
                    </ul>
                    Hovering over any value reveals the full formatted number with separators for precision.
                  </li>
                  <li><strong>Click to cycle views:</strong> Clicking inside a rotation box cycles through progressively detailed breakdowns.
                    <ul>
                      <li>First displays the <em>Total</em> (all skills or characters combined).</li>
                      <li>Subsequent clicks move through each component — skills in your personal rotation, or characters in your team rotation.</li>
                    </ul>
                  </li>
                  <li><strong>Contribution:</strong> Contributions (teammates or damage type) are shown as percentage values.</li>
                  <li><strong>Missing breakdowns:</strong> If a saved rotation doesn’t yet have detailed breakdown data, you’ll see the note <em>“Re-save to see breakdown.”</em> Simply load and re-save the rotation to generate its per-skill details.</li>
                  <li><strong>Visibility:</strong> The <em>Personal Rotation Box</em> always appears when you have any personal rotations saved. The <em>Team Rotation Box</em> appears only when valid team rotations exist (e.g., teammates with linked rotations through the Team Buffs section).</li>
                </ul>
                
                <p><em>Tip:</em> Both boxes behave similarly — but the personal box cycles through <strong>skills</strong>, while the team box cycles through <strong>characters</strong>. Changing the dropdown always resets the view back to “Total.”</p>
                
                <h4>4. Equipped Echoes</h4>
                <p>Below everything all five Echo slots in your current build are listed such that each Echo shows its icon, cost, and set badge ans stats</p>
                <p>It's section provides an instant visual summary of your entire Echo configuration — no need to switch tabs to verify substats or sets.</p>

                <h4>5. Core Combat Stats</h4>
                <p>Next to your the character portrait, your merged combat stats — all calculated in real time using data from weapons, echoes, buffs, and teammates. The grid includes:</p>
                <ul>
                    <li><strong>Base Attributes:</strong> HP, ATK, DEF, and Energy Regen.</li>
                    <li><strong>Offensive Stats:</strong> Crit Rate, Crit DMG, Elemental DMG Bonus, and Skill-specific bonuses.</li>
                </ul>

                <h4>6. Teammate Summary</h4>
                <p>Your selected teammates are displayed as icons. In that same section any <strong>Echo Set</strong> or <strong>Weapon Buffs</strong> from <strong>Team Buffs</strong> show on here.</p>

                <h4>7. Derived Metrics</h4>
                <p>The Overview includes advanced metrics like <strong>Crit Value (CV)</strong> and <strong>Build Score</strong>, which evaluate how optimized your build is. These are derived automatically:</p>
                <ul>
                    <li><strong>Crit Value (CV):</strong> A combined score from Crit Rate and Crit DMG — used to measure offensive balance.</li>
                    <li><strong>Build Score:</strong> A normalized build quality metric based on Echo substat efficiency and scoring. (See more under the <strong>Scoring</strong> guide category.</li>
                </ul>

                <h4>8. Real-Time Updates and Interaction</h4>
                <p>The Overview Section is fully synchronized with the rest of the app:</p>
                <ul>
                    <li>Changing an Echo or stat in any other pane updates the Overview immediately.</li>
                    <li>Swapping weapons or refining passives reflects in both visual display and numeric stats.</li>
                    <li>Enabling or disabling buffs from teammates dynamically adjusts totals shown here.</li>
                </ul>

                <h4>9. Screenshot Export</h4>
                <p>The Overview supports both light and dark modes automatically and is designed for visual exports. You can capture it using the <strong>Screenshot</strong> or <strong>Copy to Clipboard</strong> options in your calculator for easy sharing.</p>

                <p><span style="font-weight: bold; color: red">Important:</span> You can't explicitly change a character's build from this interface.</p>
            `
            }
        ]
    },
    {
        category: 'Damage & Scaling',
        guides: [
            {
                title: 'Understanding the Damage Section',
                type: 'article',
                shortDesc: 'Learn how damage is calculated and how to read skill breakdowns and sub-hits in the results display.',
                content: `
                <p>The <strong>Damage Section</strong> shows the calculated output of every skill or effect for your active character, based on the same combat model described on the <a href="https://wutheringwaves.fandom.com/wiki/Damage" target="_blank" rel="noopener noreferrer"><strong>Wuthering Waves Wiki</strong></a>. It combines your stats, skill multipliers, and combat modifiers into final <strong>Normal</strong>, <strong>CRIT</strong>, and <strong>Average</strong> values.</p>
        
                <h4>1. How Damage is Calculated</h4>
                <p>Every skill uses scaling values for ATK, HP, or DEF, applies multipliers and bonuses, then adjusts for enemy defense and resistance.</p>
                <pre><code class="language-js">
        Base = (ATK × atkScaling) + (HP × hpScaling) + (DEF × defScaling)
        Final = (Base × Multiplier + FlatBonus)
              × defMult × resMult × (1 + Bonuses) × (1 + Amplifications)
        Crit  = Final × (1 + CritDmg)
        Avg   = (Crit × CritRate) + (Final × (1 - CritRate))
                </code></pre>
                <p>This model also handles DoT effects like <span style="color: rgb(202,179,63); font-weight: bold;">Spectro Frazzle</span> and <span style="color: rgb(15,205,160); font-weight: bold;">Aero Erosion</span> using per-tick multipliers, applied without crit variance but still affected by resistance and DoT amplification.</p>
        
                <h4>2. Reading the Damage Display</h4>
                <p>Each skill row shows three columns — <strong>Normal</strong>, <strong>CRIT</strong>, and <strong>AVG</strong> — representing the calculated output after all modifiers. Hovering over a number shows its precise value with formatting separators for clarity.</p>
        
                <ul>
                  <li><strong>Normal:</strong> Damage without crits or variance.</li>
                  <li><strong>CRIT:</strong> Damage with full crit multiplier.</li>
                  <li><strong>AVG:</strong> Weighted damage using current crit rate.</li>
                </ul>
        
                <h4>3. Sub-Hits and Multi-Hit Skills</h4>
                <p>Some skills, such as multi-hit combos or chained attacks, include expandable <strong>sub-hit breakdowns</strong>. Click the checkbox above the damage section to toggle the detailed breakdown for all skills.</p>
                <ul>
                  <li>Each sub-hit lists its own Normal, CRIT, and AVG values.</li>
                  <li>Hovering over a main skill's hit value shows its sub-hit formula.</li>
                </ul>
        
                <h4>4. Tips and Visual Cues</h4>
                <ul>
                  <li>Values exceeding certain thresholds are cut off (e.g., 51.8B ).</li>
                  <li>Support skills such as healing and shielding are highlighted.</li>
                  <li>Echo skills show once a main echo with skills that inflict damage is set.</li>
                </ul>
                
                <h4>6. Summary</h4>
                <p>All values are derived using the same structure as in the <a href="https://wutheringwaves.fandom.com/wiki/Damage" target="_blank" rel="noopener noreferrer">Wuthering Waves damage formula</a>. The interface simply visualizes this computation — showing how scaling, bonuses, and defenses shape each skill’s final performance.</p>
              `
            }
        ]
    },


    {
        category: 'Build and Echo Scoring',
        guides: [
            {
                title: 'Understanding the Scoring System',
                type: 'article',
                shortDesc: 'How Echo stats, rolls, and character weights combine into a total build score.',
                content: `
                <p>The calculator uses a dynamic <strong>Scoring System</strong> to evaluate the quality of your Echoes and overall build efficiency. It measures both <strong>substat rolls</strong> and <strong>character-specific stat relevance</strong> to produce consistent, comparable results — expressed through values like <strong>Echo Score</strong>, <strong>Percent Score</strong>, and <strong>Crit Value (CV)</strong>.</p>
        
                <h4>1. Purpose of the Scoring System</h4>
                <p>In <a href="https://wutheringwaves.fandom.com/wiki/Echo/Stats" target="_blank" rel="noopener noreferrer">Wuthering Waves</a>, Echoes can roll stats with variable strength, and not every stat benefits each character equally. This scoring model solves that by weighting and normalizing each stat based on:</p>
                <ul>
                  <li><strong>Roll quality:</strong> How close the stat is to its maximum possible value.</li>
                  <li><strong>Character weights:</strong> How valuable that stat is for the selected character’s kit.</li>
                  <li><strong>Distribution:</strong> How much each Echo contributes to the overall build efficiency.</li>
                </ul>
        
                <h4>2. Substat Roll Quality</h4>
                <p>Each substat has a known range from its minimum to maximum possible value, divided into several “roll tiers.” The calculator grades each substat’s strength as a percentage between 0–100 based on its actual rolled value.</p>
        
                <pre><code class="language-js">
        # Example
        min = 6.4%, max = 11.6%, possibleRolls = 7
        roll = 9.6%
        → Roll Grade = 30 + ((roll - min) / (max - min)) × (100 - 30)
                </code></pre>
        
                <p>Lower-tier rolls score closer to 30, while near-perfect rolls approach 100. This simulates in-game roll variance for consistent comparison.</p>
        
                <h4>3. Main Stat and Substat Normalization</h4>
                <p>Main stats and substats are normalized by comparing them to ideal reference values per Echo cost tier:</p>
                <ul>
                  <li><strong>Cost 1 Echoes:</strong> HP% / ATK% / DEF% with flat HP as a fixed second stat.</li>
                  <li><strong>Cost 3 Echoes:</strong> Elemental or ATK% mains, flat ATK fixed second stat.</li>
                  <li><strong>Cost 4 Echoes:</strong> CRIT Rate, CRIT DMG, or Healing Bonus, with flat ATK as a secondary.</li>
                </ul>
        
                <pre><code class="language-js">
        # Normalization
        normalizedQuality = (actualValue / idealValue) × 100
        # idealValue used is 44 (crit dmg's main stat value because it's the highest)
                </code></pre>
        
                <p>This keeps all stats comparable even when using different Echo costs or stat categories.</p>
        
                <h4>4. Character Weighting</h4>
                <p>Each character in the database has a <strong>stat weight profile</strong> that defines how much value they gain from each stat type. These weights are stored per-character and applied automatically when computing Echo scores.</p>
        
                <pre><code class="language-js">
        # Example (Pheobe)
        {
          atkPercent: 1,
          atkFlat: 0.75,
          critRate: 1,
          critDmg: 1,
          heavyAtk: 0.75,
          spectro: 1
        }
                </code></pre>
        
                <p>Weights range between <code>0</code> (irrelevant) and <code>1</code> (highly desirable). They ensure the system favors stats that actually scale with the character’s kit.</p>
        
                <h4>5. Echo Score Formula</h4>
                <p>The calculator combines roll quality and stat weights to produce three key metrics for each Echo:</p>
        
                <pre><code class="language-js">
        mainScore = (mainStatValue × normalizedQuality × weight)
        subScore  = Σ (subStatValue × normalizedQuality × weight)
        totalScore = mainScore + subScore
                </code></pre>
        
                <p>Every Echo’s <code style="font-weight: bold">totalScore</code> represents its contribution to your build’s overall power potential, scaled by how relevant those stats are for your character.</p>
        
                <h4>6. Build Scoring and Percent Score</h4>
                <p>Once all Echoes are scored, the system sums their weighted totals and divides them by the theoretical maximum possible score for that character’s top 5 substats:</p>
        
                <pre><code class="language-js">
        buildScore = (TotalEchoScore / Top5SubstatMax) × 100
                </code></pre>
        
                <p>This gives your overall build a “Percent Efficiency” score, where 100% would represent a mathematically perfect distribution of substats and main stats for that character.</p>
        
                <h4>7. Crit Value (CV)</h4>
                <p>As a secondary metric, <strong>CV</strong> (Crit Value) is shown to summarize your offensive potential:</p>
        
                <pre><code class="language-js">
        CV = (Crit Rate × 2) + Crit DMG
                </code></pre>
        
                <p>While it’s a simpler measure, it’s useful for comparing builds of DPS characters that rely heavily on critical scaling.</p>
        
                <h4>8. How Scores are Displayed</h4>
                <ul>
                  <li><strong>Echo Score:</strong> Appears on each Echo tile (main + sub combined).</li>
                  <li><strong>Build Score:</strong> Shown under the Overview or Stats panels as “Build Score.”</li>
                  <li><strong>Crit Value:</strong> Listed alongside Crit Rate and Crit DMG in stat breakdowns.</li>
                </ul>
        
                <h4>9. Practical Notes</h4>
                <ul>
                  <li>Score weighting is unique per character.</li>
                  <li>Substats are graded using exact in-game roll ranges from the <a href="https://wutheringwaves.fandom.com/wiki/Echo/Stats" target="_blank" rel="noopener noreferrer">Wuthering Waves Wiki</a>.</li>
                  <li>Flat stats generally contribute less unless the character has scaling abilities that justify them.</li>
                </ul>
        
                <p>The scoring system is built to reflect in-game optimization standards, helping you identify strong Echo rolls, measure build efficiency, and compare setups on equal ground.</p>
              `
            }
        ]
    }
];