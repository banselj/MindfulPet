import { Matrix, Ciphertext, QuantumKeyPair, QuantumSecurityError } from './types';
import * as tf from '@tensorflow/tfjs';

export class LatticeCrypto {
  private static readonly LATTICE_DIMENSION = 256;
  private static readonly ERROR_BOUND = 0.1;
  private static readonly QUANTUM_NOISE_SCALE = 3.2;

  constructor() {
    // Initialize TensorFlow for matrix operations
    tf.setBackend('webgl');
    tf.enableProdMode();
  }

  public async generateKeyPair(): Promise<QuantumKeyPair> {
    try {
      const start = performance.now();

      // Generate secret key using quantum-resistant parameters
      const secretKey = await this.generateSecretKey();
      
      // Generate public matrix A
      const A = await this.generatePublicMatrix();
      
      // Generate error vector
      const e = await this.generateErrorVector();
      
      // Compute public key b = As + e
      const publicKey = await this.computePublicKey(A, secretKey, e);

      // Timing check for side-channel protection
      if (performance.now() - start > 100) {
        throw new QuantumSecurityError(
          'TIMING_ANOMALY',
          'Key generation exceeded safe time threshold'
        );
      }

      return {
        publicKey: this.tensorToMatrix(publicKey),
        secretKey: new Float32Array(secretKey.dataSync())
      };
    } catch (error) {
      throw new QuantumSecurityError(
        'KEY_GEN_FAILED',
        'Failed to generate quantum-resistant key pair',
        { originalError: error }
      );
    }
  }

  public async encrypt(message: Float32Array, publicKey: Matrix): Promise<Ciphertext> {
    try {
      const start = performance.now();

      // Convert message to tensor
      const m = tf.tensor1d(Float32Array.from(message), 'float32');
      
      // Generate random vector r
      const r = await this.generateRandomVector();
      
      // Convert public key to tensor
      const A = this.matrixToTensor(publicKey);
      
      // Compute u = A^T * r
      const u = tf.matMul(tf.transpose(A), r);
      
      // Add quantum noise for security
      const noise = await this.generateQuantumNoise(message.length);
      
      // Compute v = b^T * r + m + noise
      const v = tf.add(tf.add(tf.dot(publicKey.data, r), m), noise);

      // Timing check
      if (performance.now() - start > 50) {
        throw new QuantumSecurityError(
          'TIMING_ANOMALY',
          'Encryption exceeded safe time threshold'
        );
      }

      return {
        u: this.tensorToMatrix(u),
        v: new Float32Array(v.dataSync())
      };
    } catch (error) {
      throw new QuantumSecurityError(
        'ENCRYPTION_FAILED',
        'Failed to encrypt message',
        { originalError: error }
      );
    }
  }

  public async decrypt(ciphertext: Ciphertext, secretKey: Float32Array): Promise<Float32Array> {
    try {
      const start = performance.now();

      // Convert ciphertext components to tensors
      const u = this.matrixToTensor(ciphertext.u);
      const v = tf.tensor1d(Float32Array.from(ciphertext.v), 'float32');
      const s = tf.tensor1d(Float32Array.from(secretKey), 'float32');

      // Compute m = v - s^T * u
      const message = tf.sub(v, tf.dot(s, u));

      // Round to nearest integer for error correction
      const result = tf.round(message);

      // Timing check
      if (performance.now() - start > 50) {
        throw new QuantumSecurityError(
          'TIMING_ANOMALY',
          'Decryption exceeded safe time threshold'
        );
      }

      return new Float32Array(result.dataSync());
    } catch (error) {
      throw new QuantumSecurityError(
        'DECRYPTION_FAILED',
        'Failed to decrypt message',
        { originalError: error }
      );
    }
  }

  private async generateSecretKey(): Promise<tf.Tensor1D> {
    // Generate binary secret key using crypto.getRandomValues
    const buffer = new Uint8Array(LatticeCrypto.LATTICE_DIMENSION);
    crypto.getRandomValues(buffer);
    return tf.tensor1d(Array.from(buffer).map(x => x % 2));
  }

  private async generatePublicMatrix(): Promise<tf.Tensor2D> {
    // Generate random matrix with uniform distribution
    return tf.randomUniform(
      [LatticeCrypto.LATTICE_DIMENSION, LatticeCrypto.LATTICE_DIMENSION],
      -1,
      1
    );
  }

  private async generateErrorVector(): Promise<tf.Tensor1D> {
    // Generate error vector from discrete Gaussian distribution
    return tf.randomNormal(
      [LatticeCrypto.LATTICE_DIMENSION],
      0,
      LatticeCrypto.ERROR_BOUND
    );
  }

  private async generateQuantumNoise(length: number): Promise<tf.Tensor1D> {
    // Generate quantum-inspired noise
    return tf.randomNormal(
      [length],
      0,
      LatticeCrypto.QUANTUM_NOISE_SCALE
    );
  }

  private async computePublicKey(
    A: tf.Tensor2D,
    s: tf.Tensor1D,
    e: tf.Tensor1D
  ): Promise<tf.Tensor2D> {
    return tf.add(tf.matMul(A, tf.expandDims(s, 1)), tf.expandDims(e, 1)) as tf.Tensor2D;
  }

  private async generateRandomVector(): Promise<tf.Tensor1D> {
    return tf.randomNormal([LatticeCrypto.LATTICE_DIMENSION], 0, 1);
  }

  private tensorToMatrix(tensor: tf.Tensor): Matrix {
    return {
      rows: tensor.shape[0],
      cols: tensor.shape[1] || 1,
      data: new Float32Array(tensor.dataSync())
    };
  }

  private matrixToTensor(matrix: Matrix): tf.Tensor {
    return tf.tensor(
      Float32Array.from(matrix.data),
      [matrix.rows, matrix.cols]
    );
  }

  // Homomorphic addition for secure aggregation
  public async homomorphicAdd(ct1: Ciphertext, ct2: Ciphertext): Promise<Ciphertext> {
    try {
      const u1 = this.matrixToTensor(ct1.u);
      const u2 = this.matrixToTensor(ct2.u);
      const v1 = tf.tensor1d(Float32Array.from(ct1.v), 'float32');
      const v2 = tf.tensor1d(Float32Array.from(ct2.v), 'float32');

      return {
        u: this.tensorToMatrix(tf.add(u1, u2)),
        v: new Float32Array((await tf.add(v1, v2).data()))
      };
    } catch (error) {
      throw new QuantumSecurityError(
        'HOMOMORPHIC_ADD_FAILED',
        'Failed to perform homomorphic addition',
        { originalError: error }
      );
    }
  }
}
