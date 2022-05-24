import os

files_in  = os.listdir("./files_in")
files_map = os.listdir("./files_map")

files = []
for file in files_in:
    if file in files_map and file.endswith(".json"):
        files.append(file)

print("files: \n\t" + "\n\t".join(files))

for file in files:
    os.system("npm start ./files_in/" + file + " ./files_map/" + file + " ./files_out/" + file)

