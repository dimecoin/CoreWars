# CoreWars

Dual CPU Simulator based on syntax of Simple Simulator and using 'A Simple Machine Language' instruction set from Appendix C of "Compter Science an Overview" 12th.  This is for playing "Core Wars".


Live Demo: http://dimeproject.com/CoreWars

CoreWars Instruction Set:  http://dimeproject.com/CoreWars/codes.html

## Core Wars

The objective of Core Wars is to write 0xFF ("ie. the bomb") into the other players program memory location so that it is executed by them (and halts their CPU).

* Think of battle ships, but with shared memory.
* You don't know memory location other player will be in.
* Players can not acess each others CPUs (registers, etc), but 100% of memory is shared.
* If you bomb yourself, you lose.
* If game goes into infinite loop, both players lose.


## Rerferences and other simulators: 
* Simple Simulator: http://www.anne-gert.nl/projects/simpsim/

## TODO
* Need to add instruction `addf`.
* Need to verify instruction `addi` (for negative numbers).
* databytes (db) should be added.

* Interfaces is ulgy, needs a lot of work.
* CPU Status flags should be enums

* Allow direct edit of registers or memory?  Might be fun.
* Hover over memory should give decimal/binary value?

* Clean up javascript console.

## bugs
* label on same line as `addi` doesn't work.

### Done
* Clear button for memory and cpu registers.
* Allow setting of program offset per CPU (register 'of').
* Add versioning key.
* code needs a major clean up.
* `jmp` to labels needs to be added.
* Seperate rendering and logic code
* Keep track of all memory that cpu writes too (so it can highlight it).
* Keep track of cycle count
* 0xFF instruction should have unique CPU status flag.
* Better error handling on execution.
* Better error handling for program assembler.
* Support binary notition (when loading)
* Support decimal notition (when loading)
