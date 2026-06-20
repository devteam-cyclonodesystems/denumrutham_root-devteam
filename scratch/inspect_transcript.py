import json

transcript_path = r"C:\Users\Amrith\.gemini\antigravity\brain\be569570-4d2b-4cce-8018-2195b873ab49\.system_generated\logs\transcript.jsonl"

unique_tools = set()

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            tool_calls = obj.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name")
                if name:
                    unique_tools.add(name)
        except:
            pass

print("Unique tools called:", list(unique_tools))
