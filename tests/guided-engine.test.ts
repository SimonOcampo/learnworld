import { describe,expect,it } from "vitest";
import { advanceGuided,guidedEvents,initialGuidedState } from "@/lib/simulations/guided-engine";
describe("guided simulation engine",()=>{it("advances deterministically and stops",()=>{const events=guidedEvents("memory");let state=initialGuidedState();for(let i=0;i<10;i++)state=advanceGuided(state,events);expect(state).toEqual({step:3,revealed:["Name the storage","Apply one operation","Check lifetime"],complete:true})});it("uses a safe generic sequence for unknown families",()=>expect(guidedEvents("unknown")).toHaveLength(3))});
