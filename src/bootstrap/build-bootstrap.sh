





npm install -g grunt-cli@1.3.2


rm -rf ./bootswatch

rm ../assets/css/bootstrap.css
rm ../assets/css/bootstrap.min.css

git clone https://github.com/thomaspark/bootswatch

cd ./bootswatch

git checkout 2a3e1c5ff57f200164d123ae0bfeeb32b0045a20

npm install

cp -a ../onlykey-template ./dist/onlykey

grunt swatch:onlykey

cp ./dist/onlykey/*.css ../../assets/css/.

cd ..

rm -rf ./bootswatch