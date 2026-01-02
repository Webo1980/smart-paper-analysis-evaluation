// src/components/IntroPage/TermsDialog.jsx
import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export const TermsDialog = ({ open, onClose }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-2xl font-bold text-[#E86161] mb-4">
            Terms and Conditions
          </Dialog.Title>

          <div className="space-y-4 text-gray-700">
            <section>
              <h3 className="font-semibold text-lg mb-2">1. Purpose and Usage</h3>
              <p>
                The Smart Paper Analysis System evaluation is designed for research and 
                development purposes. All feedback will be used to improve the system's 
                performance and capabilities.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">2. Data Collection</h3>
              <p>
                We collect evaluation data, including your feedback and assessments. 
                This data will be used solely for system improvement and research purposes.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">3. Confidentiality</h3>
              <p>
                All collected data will be treated confidentially and stored securely. 
                Personal information will not be shared with third parties.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">4. Participant Rights</h3>
              <p>
                As an evaluator, you have the right to:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Access your submitted evaluations</li>
                <li>Request data deletion</li>
                <li>Withdraw from the evaluation process</li>
                <li>
                  If you have any further questions, feel free to contact Prof. 
                  <a href="mailto:auer@tib.eu" style={{ color: 'red' }}>Auer</a>.
                </li>
              </ul>
            </section>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#E86161] text-white rounded-lg hover:bg-[#c54545]"
            >
              I Understand
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};