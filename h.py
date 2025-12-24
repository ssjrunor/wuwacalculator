import pandas as pd

# Your schedule data
data = [
    ["Topic selection and proposal draft", "2025-10-15", "2025-10-18"],
    ["Initial reading / web research",      "2025-10-19", "2025-10-24"],
    ["Literature review (core sources)",    "2025-10-25", "2025-10-31"],
    ["Draft: background and basics",        "2025-11-01", "2025-11-05"],
    ["Draft: caching section",              "2025-11-06", "2025-11-10"],
    ["Draft: other techniques",             "2025-11-11", "2025-11-15"],
    ["Methodology and example design",      "2025-11-16", "2025-11-20"],
    ["Writing example and results",         "2025-11-21", "2025-11-26"],
    ["First full report draft",             "2025-11-27", "2025-12-03"],
    ["Revisions, figures, and polishing",   "2025-12-04", "2025-12-08"],
    ["Final proofreading and submission",   "2025-12-09", "2025-12-11"],
]

# Build DataFrame
df = pd.DataFrame(data, columns=["Task", "StartDate", "EndDate"])

# Convert to datetime
df["StartDate"] = pd.to_datetime(df["StartDate"])
df["EndDate"]   = pd.to_datetime(df["EndDate"])

# Duration in days (inclusive)
df["DurationDays"] = (df["EndDate"] - df["StartDate"]).dt.days + 1

# Save to Excel
output_file = "cs3983_gantt_schedule.xlsx"
df.to_excel(output_file, index=False)

print("Saved to", output_file)
print(df)