export function getStarterCode(lang: string, functionName: string = 'solve', problemTitle: string = 'Challenge'): string {
  const normLang = lang.toLowerCase();
  const titleFormatted = problemTitle.replace(/\s+/g, '');
  
  switch (normLang) {
    case 'javascript':
      return `/**
 * Problem: ${problemTitle}
 * Language: JavaScript (Node.js)
 */

function ${functionName}() {
    // Write your code here
    
    return null;
}
`;
    case 'python':
      return `# Problem: ${problemTitle}
# Language: Python 3

def ${functionName}():
    # Write your code here
    pass
`;
    case 'java':
      return `/**
 * Problem: ${problemTitle}
 * Language: Java
 */
import java.util.*;

class Solution {
    public void ${functionName}() {
        // Write your code here
        
    }
}
`;
    case 'cpp':
    case 'c++':
      return `/**
 * Problem: ${problemTitle}
 * Language: C++
 */
#include <iostream>
#include <vector>
#include <string>

using namespace std;

class Solution {
public:
    void ${functionName}() {
        // Write your code here
        
    }
};
`;
    case 'c':
      return `/**
 * Problem: ${problemTitle}
 * Language: C
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void ${functionName}() {
    // Write your code here
    
}
`;
    default:
      return `// Write your code here\n`;
  }
}
