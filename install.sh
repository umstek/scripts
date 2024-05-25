# Create a link to user's private bin
mkdir -p ~/bin

# Create a link to the script
ln -s $(pwd)/s ~/bin

echo "Please add ~/bin to PATH, if \`s\` is not working."
