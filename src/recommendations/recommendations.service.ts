import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class RecommendationsService {
  constructor() {}

  async trainModel() {
    const scriptPath = path.join(process.cwd(), 'ml/train_model.py');
    const venvPython = path.join(process.cwd(), 'ml/venv/bin/python3');

    // Prefer venv Python if it exists, otherwise try Python 3.11 (for lightfm compatibility)
    let pythonExecutable: string;
    if (fs.existsSync(venvPython)) {
      pythonExecutable = venvPython;
    } else {
      // Try Python 3.11 first (lightfm is compatible with 3.11)
      const python311 = '/usr/bin/python3.11';
      pythonExecutable = fs.existsSync(python311) ? python311 : 'python3';
    }

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(pythonExecutable, [scriptPath]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output || '✅ Training completed.');
        } else {
          // Combine both stdout and stderr for error messages
          const errorMessage =
            errorOutput || output || 'Unknown error occurred';
          reject(`❌ Error (code ${code}): ${errorMessage}`);
        }
      });
    });
  }
}
