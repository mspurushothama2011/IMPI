# Synthetic 1-hour meeting transcript generator
# Produces a realistic transcript (~10k-20k words depending on settings) with speakers, agenda, decisions, and action items.

import random
import datetime

SPEAKERS = [
    ("Alice", "PM"),
    ("John", "Engineering"),
    ("Sarah", "Infrastructure"),
    ("Mike", "Marketing"),
    ("Lisa", "Design"),
    ("Raj", "Data"),
]

TOPICS = [
    "Q4 roadmap and deliverables",
    "API v2 migration and deprecations",
    "Kubernetes production readiness",
    "Mobile app UX improvements",
    "GTM deck and pricing positioning",
    "Customer feedback analysis and NPS",
    "Budget allocations and forecasting",
]

DECISIONS = [
    "We will proceed with the API v2 rollout starting next Monday",
    "We will freeze feature development on legacy endpoints by Oct 1",
    "We will target Lighthouse performance score >= 85 on mobile",
    "We will align pricing tiers with competitor set B",
    "We will schedule weekly syncs every Monday at 10 AM",
]

ACTIONS = [
    ("John", "Implement pagination and rate limiting in API v2", "next Friday"),
    ("Sarah", "Complete production readiness checklist for new cluster", "Wednesday"),
    ("Mike", "Deliver GTM deck with competitive positioning", "Tuesday"),
    ("Lisa", "Finalize mobile UI mockups and handoff", "Thursday"),
    ("Raj", "Run customer feedback analysis and share findings", "next Monday"),
]

FILLERS = [
    "Let me share my screen.",
    "Can you hear me okay?",
    "I think we lost someone; let's give them a minute.",
    "I'll drop a link in the chat.",
    "We can circle back to that in a moment.",
    "Action item captured.",
]

random.seed(13)

def gen_paragraph(speaker, role):
    topic = random.choice(TOPICS)
    filler = random.choice(FILLERS)
    lines = [
        f"{speaker} ({role}): On {topic}, here are the key points we've observed over the last sprint.",
        f"{speaker} ({role}): {filler}",
        f"{speaker} ({role}): Performance has improved, but we need more headroom for peak traffic.",
        f"{speaker} ({role}): If we align dependencies, we can reduce risk during the release week.",
        f"{speaker} ({role}): I'll coordinate with stakeholders to confirm timelines.",
    ]
    return "\n".join(lines)


def gen_decision_block():
    d = random.choice(DECISIONS)
    return f"Decision: {d}."


def gen_action_block():
    who, task, when = random.choice(ACTIONS)
    return f"Action: {who} will {task} by {when}."


def build_transcript(minutes=60):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    out = [f"Meeting start: {ts}", "Agenda: " + ", ".join(TOPICS[:4])]
    for m in range(minutes):
        speaker, role = random.choice(SPEAKERS)
        out.append(f"\n--- Minute {m+1} ---")
        out.append(gen_paragraph(speaker, role))
        # sprinkle decisions and actions
        if m % 7 == 3:
            out.append(gen_decision_block())
        if m % 5 == 2:
            out.append(gen_action_block())
    out.append("\nMeeting end.")
    return "\n".join(out)

if __name__ == "__main__":
    text = build_transcript(minutes=60)
    print(text)
