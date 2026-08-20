let meta = #{
    name: "outrank-rd",
    description: "Watch published X weights, score fixtures, harvest a few posts, propose at most three prior changes. Never edits the scorer.",
    when_to_use: "Retune Outrank, check param.rs drift, or run the R&D cycle",
    phases: [
        #{ title: "Measure", detail: "fixtures + param.rs watch" },
        #{ title: "Harvest", detail: "at most 8 public posts" },
        #{ title: "Propose", detail: "at most 3 small changes" },
        #{ title: "Skeptic", detail: "kill clutter" },
    ],
};

let measure_schema = #{
    "type": "object",
    "properties": #{
        "fixture_ok": #{ "type": "boolean" },
        "algo_synced": #{ "type": "boolean" },
        "notes": #{ "type": "string" },
    },
};

let harvest_schema = #{
    "type": "object",
    "properties": #{
        "posts": #{
            "type": "array",
            "maxItems": 8,
            "items": #{
                "type": "object",
                "properties": #{
                    "text": #{ "type": "string" },
                    "url": #{ "type": "string" },
                    "why": #{ "type": "string" },
                    "guess_outcome": #{ "type": "string" },
                },
            },
        },
    },
};

let propose_schema = #{
    "type": "object",
    "properties": #{
        "summary": #{ "type": "string" },
        "proposals": #{
            "type": "array",
            "maxItems": 3,
            "items": #{
                "type": "object",
                "properties": #{
                    "title": #{ "type": "string" },
                    "why": #{ "type": "string" },
                    "change": #{ "type": "string" },
                    "kill_if": #{ "type": "string" },
                },
            },
        },
    },
};

let skeptic_schema = #{
    "type": "object",
    "properties": #{
        "keep": #{ "type": "boolean" },
        "reason": #{ "type": "string" },
    },
};

fn trimmed(s) {
    if type_of(s) == "string" {
        s.trim();
        s
    } else {
        ""
    }
}

let do_harvest = true;
if args != () && args.harvest == false {
    do_harvest = false;
}

phase("Measure");
let measure_prompt = "";
measure_prompt += "Work in /home/jcb/src/outrank. Read AGENTS.md and .grok/skills/outrank-rd/SKILL.md. ";
measure_prompt += "Run these two shell commands and use their real output (do not guess): ";
measure_prompt += "1) npm run rd:fixtures   2) npm run rd:watch. ";
measure_prompt += "Do not edit any files. ";
measure_prompt += "Set fixture_ok=true only if fixtures printed PASS and exited 0. ";
measure_prompt += "Set algo_synced=true only if watch printed SYNCED and exited 0. ";
measure_prompt += "Exit 1 on watch means DRIFT — set algo_synced=false, that is not a tool failure. ";
measure_prompt += "notes = the important lines (FAIL/DRIFT/PASS/SYNCED). Empty notes is invalid unless you ran both commands.";

let measure = agent(measure_prompt, #{
    label: "measure",
    capability_mode: "execute",
    output_schema: measure_schema,
});

let fixture_ok = false;
let algo_synced = false;
let measure_notes = "";
if measure != () && measure.success && measure.output != () {
    if measure.output.fixture_ok == true { fixture_ok = true; }
    if measure.output.algo_synced == true { algo_synced = true; }
    measure_notes = trimmed(measure.output.notes);
}
log("fixtures=" + fixture_ok.to_string() + " synced=" + algo_synced.to_string());

let posts = [];
if do_harvest {
    phase("Harvest");
    let harvest_prompt = "";
    harvest_prompt += "Read /home/jcb/src/outrank/AGENTS.md. Harvest at most 8 PUBLIC posts for Outrank calibration. ";
    harvest_prompt += "Buyer is operators (LinkedIn-on-X: lessons, announces, thoughts?). ";
    harvest_prompt += "Get a mix: posts that clearly printed (high replies/quotes/reposts) AND posts that died (thin advice, link+hashtag dumps). ";
    harvest_prompt += "Use X search tools if available (keyword/semantic). Otherwise web_search. ";
    harvest_prompt += "Do not invent engagement numbers. Do not harvest hate, slurs, or evasion how-tos. ";
    harvest_prompt += "Do not edit files. Empty posts is valid only after you actually searched and found nothing usable. ";
    harvest_prompt += "guess_outcome must be one of blew_up, worked, mid, died.";
    let harvest = agent(harvest_prompt, #{
        label: "harvest",
        capability_mode: "read-only",
        output_schema: harvest_schema,
    });
    if harvest != () && harvest.success && harvest.output != () && harvest.output.posts != () {
        posts = harvest.output.posts;
    }
    log("harvested=" + posts.len().to_string());
}

phase("Propose");
let propose_prompt = "";
propose_prompt += "Read /home/jcb/src/outrank/AGENTS.md and /home/jcb/src/outrank/.grok/skills/outrank-rd/SKILL.md. ";
propose_prompt += "Read research/goldens.json. Do not edit src/. ";
propose_prompt += "Measure notes: " + json_encode(measure_notes) + ". ";
propose_prompt += "fixture_ok=" + fixture_ok.to_string() + " algo_synced=" + algo_synced.to_string() + ". ";
propose_prompt += "Harvested posts JSON: " + json_encode(posts) + ". ";
propose_prompt += "If there are harvested posts, score each with: npm run rd:fixtures -- --score \"TEXT\" in /home/jcb/src/outrank. ";
propose_prompt += "Also score any files in research/packs/*.json if present. ";
propose_prompt += "Propose AT MOST 3 changes. Each is one prior, one feature check, or one coach sentence. ";
propose_prompt += "Name the file and the published weight it serves. Name kill_if (how fixtures would catch a bad change). ";
propose_prompt += "If goldens failed, the proposal must be restore the floor, not add a lane. ";
propose_prompt += "If algo drifted, one proposal may be the snapshot/weights/changelog patch — still do not edit. ";
propose_prompt += "Zero proposals is valid if nothing is both falsifiable and useful to a paying operator. ";
propose_prompt += "Never propose an LLM on the live scorer, a new lane/tribe, or evasion coaching.";

let propose = agent(propose_prompt, #{
    label: "propose",
    capability_mode: "execute",
    output_schema: propose_schema,
});

let proposals = [];
let summary = "";
if propose != () && propose.success && propose.output != () {
    summary = trimmed(propose.output.summary);
    if propose.output.proposals != () {
        proposals = propose.output.proposals;
    }
}

if proposals.len() == 0 {
    let report = "# Outrank R&D\n\n";
    report += summary;
    if report == "# Outrank R&D\n\n" { report += "No proposals.\n"; }
    report += "\n\nfixtures_ok=" + fixture_ok.to_string() + " algo_synced=" + algo_synced.to_string() + "\n";
    let p = write_scratch_file("report.md", report);
    complete(#{ path: p, summary: "No proposals.", fixture_ok: fixture_ok, algo_synced: algo_synced, kept: [] });
}

phase("Skeptic");
let jobs = [];
let i = 0;
for prop in proposals {
    let sp = "";
    sp += "You are a skeptic for Outrank. Read /home/jcb/src/outrank/AGENTS.md. ";
    sp += "Keep=true ONLY if this proposal is a small, falsifiable change that helps a paying operator ";
    sp += "with a published ranking fact they do not already know (copy-link, conversation, one original, 48h, don't nuke). ";
    sp += "keep=false if it adds a lane/tribe, chases scene sociology, puts an LLM on live scoring, ";
    sp += "coaches evasion, cannot be killed by a fixture, or is a wild goose chase. ";
    sp += "Proposal JSON: " + json_encode(prop) + ". ";
    sp += "Default keep=false if unsure. Do not edit files.";
    jobs.push(#{
        prompt: sp,
        label: "skeptic-" + i.to_string(),
        capability_mode: "read-only",
        output_schema: skeptic_schema,
    });
    i += 1;
}
let verdicts = parallel(jobs);

let kept = [];
let ki = 0;
for v in verdicts {
    if v != () && v.success && v.output != () && v.output.keep == true {
        if trimmed(v.output.reason) != "" {
            kept.push(proposals[ki]);
        }
    }
    ki += 1;
}
log("kept=" + kept.len().to_string() + "/" + proposals.len().to_string());

let report = "# Outrank R&D\n\n";
report += summary + "\n\n";
report += "fixtures_ok=" + fixture_ok.to_string() + " algo_synced=" + algo_synced.to_string() + "\n\n";
report += "## Kept (" + kept.len().to_string() + ")\n\n";
report += json_encode(kept);
report += "\n\n## Dropped\n\n";
report += "Proposed " + proposals.len().to_string() + ", kept " + kept.len().to_string() + " after skeptic.\n";
report += "Do not edit the scorer until the user accepts a kept proposal.\n";
let p = write_scratch_file("report.md", report);
complete(#{
    path: p,
    summary: kept.len().to_string() + " kept proposal(s)",
    fixture_ok: fixture_ok,
    algo_synced: algo_synced,
    kept: kept,
});
