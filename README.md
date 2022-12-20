# magic-stone-circuit

https://magic-stone-circuit.000webhostapp.com/

Its a fun project.

Once I have enthusiastically studied the origins of computer engineering, circuitry, and semiconductor physics. It was an interesting experience that is very different from high-level programming. For me, it was more of a fun than a professional hobby.

In my most cherished dreams, I really wanted to be a pioneer. Create the first transitors. The first logic circuits. The first computers. The first programs.

I decided to try to make a computer game about logic circuits. It will have other laws of physics, which, with a certain imagination, will give me the opportunity to consider myself as a pioneer.

## guides

https://www.youtube.com/channel/UCT4Y7ks649av1x26jUt9w2g

## development

- Task 1: game scene should autoscale to browser size.
- Task 2: create a gamescene with a coordinate grid; place a magic stone by mouse click.
- Task 3: resize grid; move grid by mouse.
- Task 4: stones should be on scheme and save position while grid is moving.
- Task 5: buttons to change stone colors; help note; energy stone.
- Task 6: transport roads.
- Task 7: coloring roads with energy.
- Task 8: sleepy road may awake.
- Task 9: correct reset of color. --Done 1-9
- Task 10: restrict to put objects where they should not be. --В
- Task 11: cancel of cached actions should be targeted. --D
- Task 12: energy starts coloring roads, not stones. Switchers. --C
- Task 13: smiles consume energy. --D
- Task 14: put roads by start-end. --D
- Task 15: add variations on putting roads.
- Task 16: big menu at left. --D
- Task 17: save current scheme to local storage. --D
- Task 18: save local storage to file, load from file.
- Task 19: save blueprints to local storage, add them to menu. --D
- Task 20: help and learn-how-to guide. --D
- Task 21: lock tick on any timeout changes. --C
- Task 22: variations on road-cell switch. --D
- Task 23: one-way energy filter. --C
- Task 24: turn semiconductors; disable big semiconductors. --D
- Task 25: special colors while road building.
- Task 26: delete LIGHT HEAVY road types; implement directions types. --D
- Task 27: variations on road-cell switch 2. --D
- Task 28: right click road build feature improve. --D
- Task 29: TypeScript. --D
- Task 30: game levels and save scheme menu. --D
- Task 31: nice message about win. --D
- Task 32: delete scheme. --D
- Task 33: more levels.
- Task 34: improve modal. --D
- Task 35: languages serbian ukrainian belorussian russian and english.
- Task 36: filter buttons on levels. --D
- Task 37: graphics optimizations one.
- Task 38: wait for next vacation and update code very little... :( --D
- Task 39: trigger --D
- Task 40: scale --D
- Task 41: color flow speeders. --D
- Task 42: fast move using arrows.
- Task 43: patterns packed to fast-animated-logic-blocks.
- Task 44: ghosts to play with them.
- Task 45: clock generator
- Task 46: monitor cell with remote light on.
- Task 47: big problem with async colorings. --D
- Task 48: better performance for patters, rotate etc.
- Task 49: delete section in frame. --D
- Task 50: delete road by path.
- Task 51: switchers hidden edit.

## docker

docker build -t magic_stones -f ./docker/Dockerfile .

docker run -d -p 3013:80 magic_stones
