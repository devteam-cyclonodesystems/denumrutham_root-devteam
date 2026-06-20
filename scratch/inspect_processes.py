import psutil
import os

def main():
    print("Inspecting running python processes...")
    for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'environ']):
        try:
            name = proc.info['name']
            if name and 'python' in name.lower():
                cmdline = proc.info['cmdline']
                environ = proc.info['environ']
                # Skip pytest processes if they are too noisy
                cmdline_str = " ".join(cmdline) if cmdline else ""
                if "pytest" in cmdline_str:
                    continue
                
                print(f"\nProcess ID: {proc.info['pid']}")
                print(f"Command Line: {cmdline_str}")
                
                db_url = environ.get("DATABASE_URL")
                env_val = environ.get("ENVIRONMENT")
                railway_env = environ.get("RAILWAY_ENVIRONMENT")
                print(f"  ENVIRONMENT:         {env_val}")
                print(f"  RAILWAY_ENVIRONMENT: {railway_env}")
                print(f"  DATABASE_URL:        {db_url}")
                
                # Print any other database or configuration variables
                for k, v in environ.items():
                    if any(x in k.upper() for x in ["DATABASE", "CONN", "POSTGRES", "DB", "PORT", "RAILWAY"]):
                        if k != "DATABASE_URL":
                            print(f"  {k}: {v}")
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess) as e:
            continue

if __name__ == "__main__":
    main()
