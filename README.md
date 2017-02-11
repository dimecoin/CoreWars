# CoreWars

Dual CPU Simulator based on syntax of Simple Simulator and using 'A Simple Machine Language' instruction set from Appendix C of "Compter Science an Overview" 12th.  This is for playing "Core Wars".


Live Demo: http://dimeproject.com/CoreWars


## Core Wars

The objective of Core Wars is to write 0xFF ("ie. the bomb") into the other players program memory location so that it is executed by them (and halts their CPU).

* Think of battle ships, but with shared memory.
* You don't know memory location other player will be in.
* Players can not acess each others CPUs (registers, etc), but 100% of memory is shared.
* If you bomb yourself, you lose.
* If game goes into infinite loop, both players lose.


## Rerferences and other simulators: 
See: http://www.anne-gert.nl/projects/simpsim/
