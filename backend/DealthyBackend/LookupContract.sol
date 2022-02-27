pragma solidity >=0.7.0 <0.9.0;
 

contract LookupContract {

mapping (string => string) public myDirectory;

constructor (string memory _name, string memory _coords) public {
        myDirectory[_name] = _coords;
    }

function setCoordinates(string memory _name, string memory _coords) public {
        myDirectory[_name] = _coords;
    }

function getCoordinates(string memory _name) public view returns (string memory) {
        return myDirectory[_name];
    }
}